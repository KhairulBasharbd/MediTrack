import axios from 'axios';
import { Appointment, Doctor, TimeSlot, TriageResult, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach authorization header automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('meditrack_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified API services
export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const res = await apiClient.post<{ success: boolean; data: { token: string; user: User } }>(
        '/auth/login',
        credentials
      );
      return res.data;
    },
    register: async (payload: {
      name: string;
      email: string;
      password: string;
      role: 'PATIENT' | 'DOCTOR';
      specialization?: string;
      phone?: string;
    }) => {
      const res = await apiClient.post<{ success: boolean; data: { token: string; user: User } }>(
        '/auth/register',
        payload
      );
      return res.data;
    },
    getMe: async () => {
      const res = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
      return res.data;
    },
  },

  doctors: {
    getAll: async () => {
      const res = await apiClient.get<{ success: boolean; data: Doctor[] }>('/doctors');
      return res.data;
    },
  },

  appointments: {
    getAll: async () => {
      const res = await apiClient.get<{ success: boolean; data: Appointment[] }>('/appointments');
      return res.data;
    },
    getById: async (id: string) => {
      const res = await apiClient.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`);
      return res.data;
    },
    create: async (data: { doctorId: string; scheduledAt: string; symptoms: string }) => {
      const res = await apiClient.post<{ success: boolean; data: Appointment; message: string }>(
        '/appointments',
        data
      );
      return res.data;
    },
    updateStatus: async (id: string, status: string, notes?: string) => {
      const res = await apiClient.patch<{ success: boolean; data: Appointment; message: string }>(
        `/appointments/${id}/status`,
        { status, notes }
      );
      return res.data;
    },
    delete: async (id: string) => {
      const res = await apiClient.delete<{ success: boolean; message: string }>(
        `/appointments/${id}`
      );
      return res.data;
    },
    getSlots: async (doctorId: string, date: string) => {
      const res = await apiClient.get<{
        success: boolean;
        data: { doctorId: string; date: string; slots: TimeSlot[] };
      }>(`/appointments/slots/${doctorId}?date=${date}`);
      return res.data;
    },
    previewTriage: async (symptoms: string) => {
      const res = await apiClient.post<{ success: boolean; data: TriageResult }>(
        '/appointments/triage-preview',
        { symptoms }
      );
      return res.data;
    },
  },
};
