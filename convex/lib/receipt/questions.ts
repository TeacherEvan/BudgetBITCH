import type { FieldCandidate, FieldName, Question } from './types';

const FIELD_ORDER: FieldName[] = ['total', 'date', 'merchant', 'category', 'currency'];

export function generateQuestions(
  fields: Record<FieldName, FieldCandidate | null>,
  confidence: Record<FieldName, number>
): Question[] {
  const questions: Question[] = [];

  for (const field of FIELD_ORDER) {
    if (questions.length >= 3) break;

    const conf = confidence[field] ?? 0;
    const cand = fields[field];

    // Hard rule: total always asks or pre-fills if < 0.85
    // Other fields ask if < 0.55 or missing
    const threshold = field === 'total' ? 0.85 : 0.55;

    if (conf < threshold) {
      if (cand && cand.value) {
        questions.push({
          kind: 'confirm',
          field,
          prompt: `Confirm ${field}: ${cand.value}`,
          value: String(cand.value),
        });
      } else {
        const inputType = field === 'total' ? 'amount' : field === 'date' ? 'date' : 'text';
        questions.push({
          kind: 'entry',
          field,
          prompt: `Enter ${field}`,
          inputType,
        });
      }
    }
  }

  return questions;
}

export function applyAnswers(
  fields: Record<FieldName, FieldCandidate | null>,
  confidence: Record<FieldName, number>,
  answers: Record<string, string>
): {
  updatedFields: Record<FieldName, FieldCandidate | null>;
  updatedConfidence: Record<FieldName, number>;
} {
  const updatedFields = { ...fields };
  const updatedConfidence = { ...confidence };

  for (const [key, val] of Object.entries(answers)) {
    const field = key as FieldName;
    if (FIELD_ORDER.includes(field)) {
      updatedFields[field] = {
        value: field === 'total' ? parseFloat(val) || val : val,
        conf: 1.0,
        ruleId: 'user-answer',
      };
      updatedConfidence[field] = 1.0;
    }
  }

  return { updatedFields, updatedConfidence };
}
