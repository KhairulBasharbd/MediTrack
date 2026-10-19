import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Listing all available doctors (authenticated users)
router.get('/', authenticate, DoctorController.getAll);

export default router;
