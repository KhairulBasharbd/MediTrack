import { prisma } from '../lib/prisma';
import { AppointmentStatus, UrgencyLevel } from '@prisma/client';
import { triageSymptoms } from './ai.service';
import { CreateAppointmentInput } from '../schemas/appointment.schema';

// Slot conflict window: 30 minutes before and after
export const SLOT_WINDOW_MINUTES = 30;

// Standard clinic hours: 10:00 AM to 5:00 PM (excluding 1:00 PM to 2:00 PM lunch break)
export const CLINIC_DAILY_SLOTS = [
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
];

/**
 * Pure function: Validates state machine status transitions.
 * Live interviewers love this because it is clean, easy to test, and easy to explain.
 */
export function isValidStatusTransition(
  current: AppointmentStatus,
  next: AppointmentStatus,
  userRole: 'PATIENT' | 'DOCTOR',
  isPatientOwner: boolean
): { allowed: boolean; reason?: string } {
  // Terminal states cannot be changed
  if (current === 'COMPLETED') {
    return { allowed: false, reason: 'Completed appointments are locked and cannot be modified.' };
  }
  if (current === 'CANCELLED') {
    return { allowed: false, reason: 'Cancelled appointments cannot be reopened.' };
  }
  if (current === next) {
    return { allowed: false, reason: `Appointment is already ${current}.` };
  }

  // Patient permissions
  if (userRole === 'PATIENT') {
    if (!isPatientOwner) {
      return { allowed: false, reason: 'You can only manage your own appointments.' };
    }
    // Patients can ONLY cancel pending appointments
    if (current === 'PENDING' && next === 'CANCELLED') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Patients can only cancel pending appointments.',
    };
  }

  // Doctor permissions
  if (userRole === 'DOCTOR') {
    if (current === 'PENDING' && (next === 'CONFIRMED' || next === 'CANCELLED')) {
      return { allowed: true };
    }
    if (current === 'CONFIRMED' && (next === 'COMPLETED' || next === 'CANCELLED')) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `Invalid doctor status transition from ${current} to ${next}.`,
    };
  }

  return { allowed: false, reason: 'Unauthorized transition request.' };
}

/**
 * Checks if a doctor already has an active appointment in the given time window
 */
export async function checkDoctorSlotConflict(
  doctorId: string,
  scheduledAt: Date,
  excludeId?: string
): Promise<boolean> {
  const windowMs = SLOT_WINDOW_MINUTES * 60 * 1000;
  const windowStart = new Date(scheduledAt.getTime() - windowMs);
  const windowEnd = new Date(scheduledAt.getTime() + windowMs);

  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ['PENDING', 'CONFIRMED'] },
      scheduledAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
  });

  return !!conflict;
}

export class AppointmentService {
  /**
   * Book new appointment with slot checking and automatic AI triage
   */
  static async createAppointment(patientId: string, input: CreateAppointmentInput) {
    const scheduledDate = new Date(input.scheduledAt);

    // Verify doctor exists and has DOCTOR role
    const doctor = await prisma.user.findFirst({
      where: { id: input.doctorId, role: 'DOCTOR' },
    });

    if (!doctor) {
      const err = new Error('Selected doctor does not exist.') as any;
      err.statusCode = 404;
      throw err;
    }

    // Check for scheduling conflict
    const hasConflict = await checkDoctorSlotConflict(input.doctorId, scheduledDate);
    if (hasConflict) {
      const err = new Error(
        'The selected doctor is unavailable during this time window. Please choose another slot.'
      ) as any;
      err.statusCode = 409;
      throw err;
    }

    // Run AI symptom triage
    const triage = await triageSymptoms(input.symptoms);

    // Create appointment in database
    return await prisma.appointment.create({
      data: {
        patientId,
        doctorId: input.doctorId,
        scheduledAt: scheduledDate,
        symptoms: input.symptoms,
        aiCategory: triage.category,
        aiUrgency: triage.urgency as UrgencyLevel,
        aiAdvice: triage.advice,
        status: 'PENDING',
      },
      include: {
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }

  /**
   * Fetch appointments filtered by user role
   */
  static async getAppointments(userId: string, role: 'PATIENT' | 'DOCTOR') {
    const where = role === 'PATIENT' ? { patientId: userId } : { doctorId: userId };

    return await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }

  /**
   * Fetch single appointment detail
   */
  static async getAppointmentById(id: string, userId: string, role: 'PATIENT' | 'DOCTOR') {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          select: { id: true, name: true, specialization: true },
        },
        patient: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!appointment) {
      const err = new Error('Appointment not found.') as any;
      err.statusCode = 404;
      throw err;
    }

    if (role === 'PATIENT' && appointment.patientId !== userId) {
      const err = new Error('Access denied.') as any;
      err.statusCode = 403;
      throw err;
    }

    if (role === 'DOCTOR' && appointment.doctorId !== userId) {
      const err = new Error('Access denied.') as any;
      err.statusCode = 403;
      throw err;
    }

    return appointment;
  }

  /**
   * Update appointment status enforcing the state machine
   */
  static async updateStatus(
    id: string,
    newStatus: AppointmentStatus,
    notes: string | undefined,
    userId: string,
    role: 'PATIENT' | 'DOCTOR'
  ) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      const err = new Error('Appointment not found.') as any;
      err.statusCode = 404;
      throw err;
    }

    const isPatientOwner = appointment.patientId === userId;
    const transitionCheck = isValidStatusTransition(
      appointment.status,
      newStatus,
      role,
      isPatientOwner
    );

    if (!transitionCheck.allowed) {
      const err = new Error(transitionCheck.reason || 'Invalid status transition.') as any;
      err.statusCode = 400;
      throw err;
    }

    return await prisma.appointment.update({
      where: { id },
      data: {
        status: newStatus,
        notes: notes !== undefined ? notes : appointment.notes,
      },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        patient: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
  }

  /**
   * Calculate daily slot availability for a given doctor on a specific date (YYYY-MM-DD)
   */
  static async getAvailableSlots(doctorId: string, dateStr: string) {
    // Start of the day and end of the day in UTC/local
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        scheduledAt: { gte: dayStart, lte: dayEnd },
      },
      select: { scheduledAt: true },
    });

    // Check each standard clinic slot
    const slots = CLINIC_DAILY_SLOTS.map((time) => {
      const [hour, minute] = time.split(':').map(Number);
      const slotDate = new Date(`${dateStr}T00:00:00.000Z`);
      slotDate.setUTCHours(hour, minute, 0, 0);

      // Check if slot falls inside any active booking window (+/- 30 min)
      const windowMs = SLOT_WINDOW_MINUTES * 60 * 1000;
      const isBooked = bookedAppointments.some((appt) => {
        const diff = Math.abs(appt.scheduledAt.getTime() - slotDate.getTime());
        return diff < windowMs;
      });

      return {
        time,
        isoString: slotDate.toISOString(),
        available: !isBooked,
      };
    });

    return {
      doctorId,
      date: dateStr,
      slots,
    };
  }

  /**
   * Delete an appointment record (CRUD - Delete)
   */
  static async deleteAppointment(id: string, userId: string, role: 'PATIENT' | 'DOCTOR') {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      const err = new Error('Appointment not found.') as any;
      err.statusCode = 404;
      throw err;
    }

    if (role === 'PATIENT' && appointment.patientId !== userId) {
      const err = new Error('Access denied.') as any;
      err.statusCode = 403;
      throw err;
    }

    if (role === 'DOCTOR' && appointment.doctorId !== userId) {
      const err = new Error('Access denied.') as any;
      err.statusCode = 403;
      throw err;
    }

    return await prisma.appointment.delete({
      where: { id },
    });
  }
}

