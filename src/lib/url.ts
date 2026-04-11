export function isAbsoluteHttpUrl(value: string | undefined | null) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return false;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}
