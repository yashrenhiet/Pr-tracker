import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "../Spinner";
import styles from "./styles.module.css";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables the button, for in-flight mutations. */
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[styles.button, styles[variant], className].filter(Boolean).join(" ")}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}
