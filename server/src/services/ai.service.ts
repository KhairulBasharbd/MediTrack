import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface TriageResult {
  category: string;
  urgency: UrgencyLevel;
  advice: string;
  source: 'gemini-flash-lite-latest' | 'heuristic-fallback';
}

// Emergency & high priority clinical keywords for fallback
const EMERGENCY_KEYWORDS = [
  'chest pain',
  'heart attack',
  'shortness of breath',
  'difficulty breathing',
  'unconscious',
  'stroke',
  'paralysis',
  'seizure',
  'profuse bleeding',
  'severe bleeding',
];

const HIGH_PRIORITY_KEYWORDS = [
  'high fever',
  'severe abdominal pain',
  'persistent vomiting',
  'head injury',
  'burn',
  'fracture',
  'broken bone',
  'blurred vision',
];

const MEDIUM_PRIORITY_KEYWORDS = [
  'fever',
  'cough',
  'throat pain',
  'stomach ache',
  'vomiting',
  'dizziness',
  'migraine',
  'ear pain',
  'rash',
  'back pain',
];

/**
 * Heuristic fallback triage:
 * Provides instant classification based on clinical urgency heuristics.
 * Guarantees zero downtime if external API rate limits or network is unavailable.
 */
export function heuristicTriage(symptoms: string): TriageResult {
  const text = symptoms.toLowerCase();

  // Category detection heuristic
  let category = 'General Medicine';
  if (text.includes('chest') || text.includes('heart') || text.includes('palpitation')) {
    category = 'Cardiology';
  } else if (text.includes('breath') || text.includes('cough') || text.includes('lung') || text.includes('asthma')) {
    category = 'Respiratory Medicine';
  } else if (text.includes('head') || text.includes('dizzy') || text.includes('stroke') || text.includes('numbness')) {
    category = 'Neurology';
  } else if (
    text.includes('stomach') ||
    text.includes('abdom') ||
    text.includes('vomit') ||
    text.includes('digest') ||
    text.includes('gastric')
  ) {
    category = 'Gastroenterology';
  } else if (text.includes('skin') || text.includes('rash') || text.includes('itch') || text.includes('allergy')) {
    category = 'Dermatology';
  } else if (text.includes('bone') || text.includes('joint') || text.includes('fracture') || text.includes('muscle')) {
    category = 'Orthopedics';
  }

  // Urgency detection
  let urgency: UrgencyLevel = 'LOW';
  let advice =
    'Your symptoms appear non-urgent. Routine clinic consultation is recommended. Please consult a qualified physician.';

  if (EMERGENCY_KEYWORDS.some((kw) => text.includes(kw))) {
    urgency = 'EMERGENCY';
    advice =
      'CRITICAL: Symptoms indicate a potentially life-threatening condition. Please seek immediate emergency medical care.';
  } else if (HIGH_PRIORITY_KEYWORDS.some((kw) => text.includes(kw))) {
    urgency = 'HIGH';
    advice =
      'URGENT: Symptoms indicate moderate-to-severe discomfort. Prioritized doctor evaluation is strongly advised.';
  } else if (MEDIUM_PRIORITY_KEYWORDS.some((kw) => text.includes(kw))) {
    urgency = 'MEDIUM';
    advice =
      'MODERATE: Symptoms require clinical evaluation within 24-48 hours. Keep hydrated and monitor changes.';
  }

  return {
    category,
    urgency,
    advice: `${advice} (Disclaimer: Automated AI triage is for preliminary routing only and does not constitute a formal diagnosis).`,
    source: 'heuristic-fallback',
  };
}

/**
 * Main AI symptom triage service:
 * Calls Google Gemini 1.5 Flash API when key is configured,
 * otherwise falls back seamlessly to the clinical heuristic engine.
 */
export async function triageSymptoms(symptoms: string): Promise<TriageResult> {
  const apiKey = config.gemini.apiKey;

  // Use heuristic fallback if no key or demo placeholder
  if (!apiKey || apiKey === 'demo_gemini_api_key_placeholder') {
    console.log('ℹ️ [AI Triage] No Gemini API key provided. Using Clinical Heuristic Fallback engine.');
    return heuristicTriage(symptoms);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use minimal, fast, free-tier supported model
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

    const prompt = `
You are a clinical triage AI assistant for a hospital appointment system.
Analyze the following patient symptoms and categorize them.

Patient symptoms: "${symptoms}"

Respond STRICTLY with a valid JSON object matching this schema (no markdown, no backticks, just raw JSON):
{
  "category": "one of: Cardiology, Respiratory Medicine, Neurology, Gastroenterology, Dermatology, Orthopedics, General Medicine",
  "urgency": "one of: LOW, MEDIUM, HIGH, EMERGENCY",
  "advice": "A concise 2-3 sentence clinical guidance note for the patient, ending with a medical disclaimer"
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Clean any markdown formatting if present
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedJson);

    const validUrgencies: UrgencyLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'];
    const urgency: UrgencyLevel = validUrgencies.includes(parsed.urgency)
      ? parsed.urgency
      : 'MEDIUM';

    console.log(
      `🤖 [AI Triage] ✅ LIVE Google Gemini response received (Model: gemini-flash-lite-latest) | Category: ${parsed.category} | Urgency: ${urgency}`
    );

    return {
      category: parsed.category || 'General Medicine',
      urgency,
      advice: parsed.advice || 'Please consult with your physician for a complete medical evaluation.',
      source: 'gemini-flash-lite-latest',
    };
  } catch (error: any) {
    console.warn(
      `⚠️ [AI Triage] Gemini AI failed or unavailable (${error?.message || error}). Activating Clinical Heuristic Fallback engine.`
    );
    return heuristicTriage(symptoms);
  }
}
