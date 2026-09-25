import styles from "./styles.module.css";

export interface SpinnerProps {
  size?: number;
  label?: string;
}

/** `role="status"` announces to screen readers without stealing focus. */
export function Spinner({ size = 20, label = "Loading" }: SpinnerProps) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}
