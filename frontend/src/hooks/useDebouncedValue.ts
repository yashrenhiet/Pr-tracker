import { useEffect, useState } from "react";

/** `value`, but only after it has stopped changing for `delayMs`. Keeps filter inputs from firing a
 * request per keystroke (typing "platform" used to send 8). */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
