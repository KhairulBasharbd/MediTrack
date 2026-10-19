# MediTrack – Clinic Appointment & Patient Management System with AI Clinical Symptom Triage

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat-square)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_(NeonDB)-316192?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google_Gemini](https://img.shields.io/badge/Gemini_Flash_Lite_(Free_Tier)-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

A streamlined, production-grade clinic appointment booking system featuring role-based workflows, 30-minute slot conflict prevention, automated clinical state machines, and real-time AI clinical symptom triage powered by Google Gemini (with an offline heuristic fallback).

Built for the **NT Tech Innovation Full Stack Developer Practical Assessment**.

---

## 📑 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Folder Structure](#architecture--folder-structure)
3. [Frontend Routes & Authorization](#frontend-routes--authorization)
4. [Core Business Logic & Workflows](#core-business-logic--workflows)
5. [AI / ML Feature Explanation](#ai--ml-feature-explanation)
6. [Database Schema (NeonDB PostgreSQL)](#database-schema-neondb-postgresql)
7. [API Endpoints Reference](#api-endpoints-reference)
8. [Environment Variables](#environment-variables)
9. [Local Installation & Setup](#local-installation--setup)
10. [Running Unit Tests](#running-unit-tests)
11. [Seed Accounts & Credentials](#seed-accounts--credentials)
12. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## 🏥 Project Overview

MediTrack solves real-world clinic coordination challenges:
- **Patients** can browse doctors by specialty, see real-time time slot availability, receive instantaneous AI symptom triage assessments with urgency severity indicators, and book appointments without fear of double-booking.
- **Doctors** manage an active queue of scheduled visits with pre-computed urgency flags (`EMERGENCY`, `HIGH`, `MEDIUM`, `LOW`), enabling immediate prioritization of critical cases, and progress visits through a rigid state machine (`PENDING` ➔ `CONFIRMED` ➔ `COMPLETED` with clinical consultation notes).

---

## 🏗️ Architecture & Folder Structure

The project is structured cleanly as a decoupled monorepo:

```
MediTrack – Clinic Appointment/
├── server/                         # Express + TypeScript + Prisma Backend
│   ├── src/
│   │   ├── config.ts               # Centralized configuration & environment loader
│   │   ├── index.ts                # Express app setup and middleware
│   │   ├── controllers/            # Route request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── appointment.controller.ts
│   │   │   └── doctor.controller.ts
│   │   ├── services/               # Core business logic & database queries
│   │   │   ├── auth.service.ts
│   │   │   ├── appointment.service.ts  # Slot conflict & State machine rules
│   │   │   └── ai.service.ts           # Gemini 3.8 Flash + Heuristic fallback
│   │   ├── middlewares/            # Auth, validation, error handler
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── error.middleware.ts
│   │   ├── schemas/                # Zod schemas for input validation
│   │   │   ├── auth.schema.ts
│   │   │   └── appointment.schema.ts
│   │   └── lib/
│   │       └── prisma.ts           # Singleton PrismaClient instance
│   ├── prisma/
│   │   ├── schema.prisma           # Relational schema for NeonDB
│   │   └── seed.ts                 # Demo seed data (Doctors & Patient)
│   └── tests/                      # Vitest unit test suites
│       ├── appointment.service.test.ts
│       └── ai.service.test.ts
│
├── client/                         # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                 # Root router & role view switcher
│   │   ├── api/client.ts           # Typed Axios client with JWT interceptor
│   │   ├── context/AuthContext.tsx # Global authentication provider & session state
│   │   ├── components/             # Reusable UI components
│   │   │   ├── Navbar.tsx
│   │   │   ├── ProtectedRoute.tsx  # Role-based route guard
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── UrgencyBadge.tsx
│   │   │   └── LoadingSkeleton.tsx
│   │   └── pages/
│   │       ├── LoginPage.tsx       # Auth page with Sign In and Register tabs
│   │       ├── PatientDashboard.tsx # Booking, live slot picker, triage preview, notes
│   │       ├── DoctorDashboard.tsx  # Queue management, search filter & consultation modal
│   │       └── NotFoundPage.tsx    # 404 error page
│   └── index.html
│
└── README.md
```

---

## 🧭 Frontend Routes & Authorization Architecture

The client application (`client/src/App.tsx`) uses `react-router-dom` with role-based routing guarded by `<ProtectedRoute />`:

| Route Path | View / Component | Access Level | Description |
|---|---|---|---|
| `/` | `RootIndexRedirect` | Public / Dynamic | Automatically checks authentication. Unauthenticated visitors are routed to `/login`. Authenticated Doctors are routed to `/doctor`; Patients are routed to `/patient`. |
| `/login` | `LoginPage (mode="login")` | Public | Patient & Doctor sign-in form with email/password authentication. Redirects authenticated users to their dashboard. |
| `/register` | `LoginPage (mode="register")` | Public | Account creation form allowing users to register as either a `PATIENT` or a `DOCTOR` (with specialty selection). |
| `/patient` | `PatientDashboard` | Protected (`PATIENT`) | Comprehensive patient portal: doctor directory, conflict-free 30-min slot picker, AI symptom triage preview & booking, appointment tracking, cancellation, and doctor prescription advice. |
| `/dashboard` | `Navigate to /patient` | Protected (`PATIENT`) | Standard dashboard alias redirecting to `/patient`. |
| `/doctor` | `DoctorDashboard` | Protected (`DOCTOR`) | Doctor clinical command center: live queue counters, patient search filter, urgency prioritization, and state machine action workflow (Confirm, Cancel, and Conclude with Clinical Consultation Notes). |
| `*` | `NotFoundPage` | Public | Custom 404 error page with branding and a "Return to Home" button. |

### Role Security Guard (`ProtectedRoute.tsx`):
- **Unauthenticated users** attempting to access `/patient` or `/doctor` are intercepted and redirected to `/login`.
- **Role cross-access** (e.g. a Doctor attempting to access `/patient`, or a Patient attempting to access `/doctor`) is safely caught and redirected to their own valid dashboard without exposing restricted views.

---

## ⚙️ Core Business Logic & Workflows

### 1. 30-Minute Slot Conflict Detection
- Clinic visits are scheduled in standard 30-minute intervals (10:00 AM – 05:00 PM).
- When booking or viewing availability, the system performs an interval overlap query:
  $$\text{Window} = [\text{scheduledAt} - 30\text{ min}, \text{scheduledAt} + 30\text{ min}]$$
- If any appointment for that doctor exists in `PENDING` or `CONFIRMED` status within this range, booking is blocked and the UI marks that time slot as occupied.

### 2. Status Transition State Machine
Enforced in `isValidStatusTransition()` within `src/services/appointment.service.ts`:

```
PENDING ──────────────► CONFIRMED ──────────► COMPLETED (Locked)
   │                       │
   └──► CANCELLED (Locked)  └──► CANCELLED (Locked)
```

- `PENDING` ➔ `CONFIRMED`: Doctor only.
- `PENDING` ➔ `CANCELLED`: Patient (own appointment) or Doctor.
- `CONFIRMED` ➔ `COMPLETED`: Doctor only.
- `COMPLETED` ➔ Any: **BLOCKED** (Terminal state; consultation notes and records are preserved).
- `CANCELLED` ➔ Any: **BLOCKED** (Terminal state).

---

## 🤖 AI / ML Feature Explanation

### Overview
The system integrates an **AI Clinical Symptom Triage** feature to categorize incoming complaints and assign an urgency severity level prior to the physician's review.

- **Primary Model:** Google Gemini Flash Lite (`models/gemini-flash-lite-latest`) via `@google/generative-ai`. This model provides fast response times, high rate limits on the Google AI Studio free tier, and cost efficiency.
- **Offline / Resilient Fallback:** An embedded rule-based clinical heuristic engine (`heuristicTriage`) ensures zero downtime if the Gemini API key is rate-limited, expired, or offline.

### Verification (Live Gemini vs Offline Fallback)
Users and reviewers can immediately verify which engine generated the triage output:
1. **In the Web UI:** The AI Triage Assessment card displays a live status badge:
   - 🟢 `Google Gemini AI (Live)` — indicates live LLM inference with Gemini Flash Lite.
   - 🟡 `Clinical Rule Fallback (Offline)` — indicates the resilient heuristic engine handled the request.
2. **In Terminal Logs:** The server prints structured logs:
   - `🤖 [AI Triage] ✅ LIVE Google Gemini response received (Model: gemini-flash-lite-latest)`
   - `⚠️ [AI Triage] Gemini AI failed/unavailable. Activating Clinical Heuristic Fallback engine.`
3. **In the JSON API:** The response payload includes `"source": "gemini-flash-lite-latest"` vs `"source": "heuristic-fallback"`.

### Inputs & Outputs
- **Input:** Free-text symptom description from the patient ($5 - 1000$ characters).
- **Outputs:**
  - `category`: Medical specialty (e.g., Cardiology, Respiratory Medicine, Gastroenterology, Dermatology, General Medicine).
  - `urgency`: Priority rating (`LOW`, `MEDIUM`, `HIGH`, `EMERGENCY`).
  - `advice`: Guidance note with mandatory medical disclaimer.
  - `source`: Indicator of whether analysis was generated by `gemini-flash-lite-latest` or `heuristic-fallback`.

### Evaluation of Usefulness
- Tested with synthetic clinical test cases (e.g., *"severe chest discomfort radiating to left arm"* correctly yielded `EMERGENCY` under `Cardiology`).
- Verified that non-critical symptoms (e.g., *"mild skin redness on forearm"*) receive `LOW` urgency, preventing false alarms while prioritizing critical medical concerns.

### Limitations
1. **Preliminary Guidance Only:** The AI triage is solely for workflow prioritization and appointment routing; it does not replace formal physician examination or clinical diagnostic tools.
2. **Context Absence:** Operates on the immediate text prompt without full longitudinal patient medical history or lab values.
3. **Language Sensitivity:** Optimal accuracy is achieved with English medical terminology; colloquial dialects may produce general categorization.

---

## 🗃️ Database Schema (NeonDB PostgreSQL)

```mermaid
erDiagram
    User ||--o{ Appointment : "patientAppointments"
    User ||--o{ Appointment : "doctorAppointments"

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        Role role "PATIENT | DOCTOR"
        String specialization
        String phone
        DateTime createdAt
    }

    Appointment {
        String id PK
        String patientId FK
        String doctorId FK
        DateTime scheduledAt
        String symptoms
        String aiCategory
        UrgencyLevel aiUrgency "LOW | MEDIUM | HIGH | EMERGENCY"
        String aiAdvice
        AppointmentStatus status "PENDING | CONFIRMED | COMPLETED | CANCELLED"
        String notes
        DateTime createdAt
    }
```

---

## 📋 API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new patient or doctor account |
| `POST` | `/api/auth/login` | Public | Login with credentials and receive JWT |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |

### Appointments (`/api/appointments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/appointments/slots/:doctorId?date=YYYY-MM-DD` | Authenticated | Get 30-min slot availability for a doctor |
| `POST` | `/api/appointments/triage-preview` | Authenticated | Test AI symptom triage on demand |
| `POST` | `/api/appointments` | Patient | Book appointment (triggers conflict check & AI triage) |
| `GET` | `/api/appointments` | Authenticated | Retrieve appointments (role-filtered) |
| `GET` | `/api/appointments/:id` | Authenticated | Retrieve appointment details |
| `PATCH` | `/api/appointments/:id/status` | Authenticated | Transition status (`CONFIRMED`, `COMPLETED`, `CANCELLED`) |
| `DELETE` | `/api/appointments/:id` | Authenticated | Delete cancelled appointment record |

### Doctors (`/api/doctors`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/doctors` | Authenticated | List all active physicians and specialties |

---

## 🔑 Environment Variables

### Server (`server/.env`)
```env
# NeonDB PostgreSQL Connection URL
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

PORT=5000
NODE_ENV="development"

JWT_ACCESS_SECRET="meditrack_jwt_access_super_secret_key_2026_dev"
JWT_EXPIRES_IN="7d"

# Google Gemini API Key (Optional: heuristic fallback active if empty/demo)
GEMINI_API_KEY="demo_gemini_api_key_placeholder"

CLIENT_URL="http://localhost:5173"
```

### Client (`client/.env`)
```env
VITE_API_BASE_URL="http://localhost:5000/api"
```

---

## 🚀 Local Installation & Setup

### Prerequisites
- Node.js (v20+ or v24 LTS)
- npm or pnpm

### 1. Backend Setup
```bash
cd server
npm install

# Generate Prisma Client
npx prisma generate

# Apply migrations to your NeonDB PostgreSQL database
npx prisma migrate dev --name init

# Seed demo doctors and patient
npm run prisma:seed

# Start backend dev server
npm run dev
```
Backend will run at: `http://localhost:5000`

### 2. Frontend Setup
```bash
cd client
npm install

# Start Vite dev server
npm run dev
```
Frontend will run at: `http://localhost:5173`

---

## 🧪 Running Unit Tests

Run the test suite covering the status state machine and AI symptom triage heuristic engine:

```bash
cd server
npm test
```

Expected output:
```
✓ tests/appointment.service.test.ts (7)
✓ tests/ai.service.test.ts (5)

Test Files  2 passed (2)
     Tests  12 passed (12)
```

---

## 🔐 Seed Accounts & Credentials

Sign in with the pre-seeded clinical accounts or register a new account on the registration tab:

| Role | Email | Password | Details |
|---|---|---|---|
| **Patient** | `patient@meditrack.com` | `Patient123!` | Standard patient booking access |
| **Doctor (Cardiology)** | `dr.rahman@meditrack.com` | `Doctor123!` | Cardiology queue management |
| **Doctor (General)** | `dr.hasan@meditrack.com` | `Doctor123!` | General Medicine queue management |

---

## 💡 Known Limitations & Future Improvements
1. **SMS / Email Reminders:** Real-time SMS notifications via Twilio or local Bangladeshi SMS gateways could be added to alert patients when appointments are confirmed.
2. **Prescription Generation:** Could be expanded to generate downloadable PDF prescriptions with digital signatures.
3. **Telehealth Integration:** WebRTC video consultation links could be embedded directly into confirmed appointment cards.
