import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { triageSymptoms } from '../services/ai.service';

export class AppointmentController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const appointment = await AppointmentService.createAppointment(req.user.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully with AI symptom triage',
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const appointments = await AppointmentService.getAppointments(req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const appointment = await AppointmentService.getAppointmentById(
        req.params.id,
        req.user.id,
        req.user.role
      );
      res.status(200).json({
        success: true,
        data: appointment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const { status, notes } = req.body;
      const updated = await AppointmentService.updateStatus(
        req.params.id,
        status,
        notes,
        req.user.id,
        req.user.role
      );
      res.status(200).json({
        success: true,
        message: `Appointment status updated to ${status}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { doctorId } = req.params;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const availability = await AppointmentService.getAvailableSlots(doctorId, date);
      res.status(200).json({
        success: true,
        data: availability,
      });
    } catch (error) {
      next(error);
    }
  }

  static async previewTriage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { symptoms } = req.body;
      const result = await triageSymptoms(symptoms);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      await AppointmentService.deleteAppointment(req.params.id, req.user.id, req.user.role);
      res.status(200).json({
        success: true,
        message: 'Appointment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

