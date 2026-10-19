export type Role = 'PATIENT' | 'DOCTOR';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization?: string | null;
  phone?: string | null;
  createdAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string | null;
  phone: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  symptoms: string;
  aiCategory?: string | null;
  aiUrgency?: UrgencyLevel | null;
  aiAdvice?: string | null;
  status: AppointmentStatus;
  notes?: string | null;
  createdAt: string;
  doctor?: {
    id: string;
    name: string;
    specialization: string | null;
  };
  patient?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}

export interface TriageResult {
  category: string;
  urgency: UrgencyLevel;
  advice: string;
  source: string;
}

export interface TimeSlot {
  time: string;
  isoString: string;
  available: boolean;
}
