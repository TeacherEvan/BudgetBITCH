import type { NormalisedPayload } from './normalise';
import type { ReceiptTemplate } from './templates/za';
import { ALL_TEMPLATES } from './templates/registry';

export function matchTemplate(payload: NormalisedPayload): ReceiptTemplate | null {
  const topText = payload.lines
    .slice(0, 6)
    .map((l) => l.text)
    .join('\n');

  for (const template of ALL_TEMPLATES) {
    if (template.fingerprints.some((re) => re.test(topText))) {
      return template;
    }
  }

  return null;
}
