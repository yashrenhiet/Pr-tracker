/** Formats a backend `Instant` (UTC ISO string) using the browser's own locale and time zone. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
