import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'PATIENT' | 'DOCTOR';
    specialization?: string | null;
    phone?: string | null;
  };
}

export class AuthService {
  static async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existing) {
      const err = new Error('An account with this email already exists.') as any;
      err.statusCode = 409;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: input.role,
        specialization: input.role === 'DOCTOR' ? input.specialization || 'General Medicine' : null,
        phone: input.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        phone: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return { token, user };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      const err = new Error('Invalid email or password.') as any;
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.') as any;
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
        phone: user.phone,
      },
    };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      const err = new Error('User not found.') as any;
      err.statusCode = 404;
      throw err;
    }

    return user;
  }
}
