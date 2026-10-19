import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class DoctorController {
  static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const doctors = await prisma.user.findMany({
        where: { role: 'DOCTOR' },
        select: {
          id: true,
          name: true,
          email: true,
          specialization: true,
          phone: true,
        },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: doctors,
      });
    } catch (error) {
      next(error);
    }
  }
}
