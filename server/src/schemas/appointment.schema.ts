import { z } from 'zod';

export const createAppointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required'),
  scheduledAt: z
    .string()
    .datetime({ message: 'scheduledAt must be a valid ISO 8601 datetime string' }),
  symptoms: z
    .string()
    .min(5, 'Please describe your symptoms in at least 5 characters')
    .max(1000, 'Symptom description is too long (max 1000 characters)'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Status must be PENDING, CONFIRMED, COMPLETED, or CANCELLED' }),
  }),
  notes: z.string().max(1000).optional(),
});

export const triageRequestSchema = z.object({
  symptoms: z
    .string()
    .min(5, 'Please provide at least 5 characters of symptoms')
    .max(1000),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type TriageRequestInput = z.infer<typeof triageRequestSchema>;
