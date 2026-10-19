import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  triageRequestSchema,
} from '../schemas/appointment.schema';

const router = Router();

// Slot availability by doctor and date
router.get('/slots/:doctorId', authenticate, AppointmentController.getSlots);

// Quick preview triage before booking
router.post(
  '/triage-preview',
  authenticate,
  validate(triageRequestSchema),
  AppointmentController.previewTriage
);

// Create new appointment (Patient only)
router.post(
  '/',
  authenticate,
  requireRole('PATIENT'),
  validate(createAppointmentSchema),
  AppointmentController.create
);

// Get appointments for current user (role-filtered)
router.get('/', authenticate, AppointmentController.getAll);

// Get appointment detail by ID
router.get('/:id', authenticate, AppointmentController.getById);

// Update status (Doctor can confirm/complete/cancel; Patient can cancel pending)
router.patch(
  '/:id/status',
  authenticate,
  validate(updateAppointmentStatusSchema),
  AppointmentController.updateStatus
);

// Delete appointment (CRUD - Delete)
router.delete('/:id', authenticate, AppointmentController.delete);

export default router;
