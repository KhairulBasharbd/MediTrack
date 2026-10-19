import { describe, it, expect } from 'vitest';
import { isValidStatusTransition } from '../src/services/appointment.service';

describe('Appointment Status State Machine', () => {
  it('should allow Patient to cancel their own PENDING appointment', () => {
    const result = isValidStatusTransition('PENDING', 'CANCELLED', 'PATIENT', true);
    expect(result.allowed).toBe(true);
  });

  it('should prevent Patient from cancelling someone else appointment', () => {
    const result = isValidStatusTransition('PENDING', 'CANCELLED', 'PATIENT', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('only manage your own');
  });

  it('should prevent Patient from confirming or completing an appointment', () => {
    const confirmCheck = isValidStatusTransition('PENDING', 'CONFIRMED', 'PATIENT', true);
    expect(confirmCheck.allowed).toBe(false);

    const completeCheck = isValidStatusTransition('CONFIRMED', 'COMPLETED', 'PATIENT', true);
    expect(completeCheck.allowed).toBe(false);
  });

  it('should allow Doctor to transition PENDING to CONFIRMED', () => {
    const result = isValidStatusTransition('PENDING', 'CONFIRMED', 'DOCTOR', false);
    expect(result.allowed).toBe(true);
  });

  it('should allow Doctor to transition CONFIRMED to COMPLETED', () => {
    const result = isValidStatusTransition('CONFIRMED', 'COMPLETED', 'DOCTOR', false);
    expect(result.allowed).toBe(true);
  });

  it('should BLOCK modifying a COMPLETED appointment (Terminal state)', () => {
    const cancelCheck = isValidStatusTransition('COMPLETED', 'CANCELLED', 'DOCTOR', false);
    expect(cancelCheck.allowed).toBe(false);
    expect(cancelCheck.reason).toContain('locked');

    const revertCheck = isValidStatusTransition('COMPLETED', 'PENDING', 'DOCTOR', false);
    expect(revertCheck.allowed).toBe(false);
  });

  it('should BLOCK modifying a CANCELLED appointment (Terminal state)', () => {
    const reviveCheck = isValidStatusTransition('CANCELLED', 'CONFIRMED', 'DOCTOR', false);
    expect(reviveCheck.allowed).toBe(false);
    expect(reviveCheck.reason).toContain('cannot be reopened');
  });
});
