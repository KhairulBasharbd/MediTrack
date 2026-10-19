import { PrismaClient, Role, AppointmentStatus, UrgencyLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo doctors and patient...');

  const salt = await bcrypt.genSalt(10);
  const doctorPasswordHash = await bcrypt.hash('Doctor123!', salt);
  const patientPasswordHash = await bcrypt.hash('Patient123!', salt);

  // 1. Seed Doctors
  const doctor1 = await prisma.user.upsert({
    where: { email: 'dr.rahman@meditrack.com' },
    update: {},
    create: {
      name: 'Dr. Ayesha Rahman',
      email: 'dr.rahman@meditrack.com',
      passwordHash: doctorPasswordHash,
      role: Role.DOCTOR,
      specialization: 'Cardiology',
      phone: '+8801711000001',
    },
  });

  const doctor2 = await prisma.user.upsert({
    where: { email: 'dr.hasan@meditrack.com' },
    update: {},
    create: {
      name: 'Dr. Tanvir Hasan',
      email: 'dr.hasan@meditrack.com',
      passwordHash: doctorPasswordHash,
      role: Role.DOCTOR,
      specialization: 'General Medicine',
      phone: '+8801711000002',
    },
  });

  const doctor3 = await prisma.user.upsert({
    where: { email: 'dr.sarah@meditrack.com' },
    update: {},
    create: {
      name: 'Dr. Sarah Ahmed',
      email: 'dr.sarah@meditrack.com',
      passwordHash: doctorPasswordHash,
      role: Role.DOCTOR,
      specialization: 'Dermatology',
      phone: '+8801711000003',
    },
  });

  // 2. Seed Patient
  const patient = await prisma.user.upsert({
    where: { email: 'patient@meditrack.com' },
    update: {},
    create: {
      name: 'Khairul Basar',
      email: 'patient@meditrack.com',
      passwordHash: patientPasswordHash,
      role: Role.PATIENT,
      phone: '+8801945411140',
    },
  });

  console.log('✅ Demo users created:');
  console.log('   - Patient: patient@meditrack.com (Password: Patient123!)');
  console.log('   - Doctor 1: dr.rahman@meditrack.com (Password: Doctor123!) [Cardiology]');
  console.log('   - Doctor 2: dr.hasan@meditrack.com (Password: Doctor123!) [General Medicine]');
  console.log('   - Doctor 3: dr.sarah@meditrack.com (Password: Doctor123!) [Dermatology]');

  // 3. Seed Sample Appointments
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Sample slot at 10:30 AM tomorrow
  const slotTomorrow = new Date(tomorrow);
  slotTomorrow.setUTCHours(10, 30, 0, 0);

  const existingAppt = await prisma.appointment.findFirst({
    where: { patientId: patient.id, doctorId: doctor1.id },
  });

  if (!existingAppt) {
    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor1.id,
        scheduledAt: slotTomorrow,
        symptoms: 'Experiencing sudden mild chest tightness and occasional palpitations during morning walks.',
        aiCategory: 'Cardiology',
        aiUrgency: UrgencyLevel.HIGH,
        aiAdvice:
          'URGENT: Symptoms indicate cardiovascular strain. Prioritized clinical evaluation is strongly advised. (Disclaimer: Preliminary AI triage only).',
        status: AppointmentStatus.PENDING,
      },
    });
    console.log('✅ Sample pending appointment seeded.');
  }

  console.log('🎉 Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
