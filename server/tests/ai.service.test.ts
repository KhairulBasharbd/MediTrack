import { describe, it, expect } from 'vitest';
import { heuristicTriage } from '../src/services/ai.service';

describe('AI Clinical Symptom Triage (Heuristic Engine)', () => {
  it('should detect critical cardiac emergency for chest pain symptoms', () => {
    const result = heuristicTriage('Patient has severe chest pain radiating to left arm');
    expect(result.urgency).toBe('EMERGENCY');
    expect(result.category).toBe('Cardiology');
    expect(result.advice).toContain('CRITICAL');
  });

  it('should route respiratory symptoms correctly', () => {
    const result = heuristicTriage('Persistent cough and shortness of breath');
    expect(result.category).toBe('Respiratory Medicine');
    expect(result.urgency).toBe('EMERGENCY');
  });

  it('should detect high priority for severe abdominal pain', () => {
    const result = heuristicTriage('Severe abdominal pain and high fever since yesterday');
    expect(result.urgency).toBe('HIGH');
    expect(result.category).toBe('Gastroenterology');
  });

  it('should assign LOW urgency to non-critical dermatological symptoms', () => {
    const result = heuristicTriage('Mild skin allergy and redness on forearm');
    expect(result.urgency).toBe('LOW');
    expect(result.category).toBe('Dermatology');
  });

  it('should always append medical disclaimer in advice', () => {
    const result = heuristicTriage('Mild headache and slight fatigue');
    expect(result.advice).toContain('Disclaimer: Automated AI triage is for preliminary routing only');
  });
});
