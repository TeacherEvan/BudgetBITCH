export function splitLabeledDetail(value: string) {
  const match = value.match(/^([^:：]+)\s*[:：]\s*(.+)$/);

  if (!match) {
    return { heading: null, detail: value };
  }

  return {
    heading: match[1].trim(),
    detail: match[2].trim(),
  };
}