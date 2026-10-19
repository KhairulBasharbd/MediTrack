import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import appointmentRoutes from './routes/appointment.routes';
import doctorRoutes from './routes/doctor.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'MediTrack API',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Route registration
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);

// 404 Catch-all handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found',
  });
});

// Central error handler
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`🏥 MediTrack API running on port ${config.port} [${config.nodeEnv}]`);
    console.log(`📍 Health check: http://localhost:${config.port}/api/health`);
  });
}

export default app;
