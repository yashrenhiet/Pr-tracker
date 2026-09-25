export function describedBy(fieldId: string, error?: string, hint?: string): string | undefined {
  if (error) return `${fieldId}-error`;
  if (hint) return `${fieldId}-hint`;
  return undefined;
}
