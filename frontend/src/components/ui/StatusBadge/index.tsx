import type { PrStatus } from "../../../types";
import { STATUS_CATEGORY } from "./categories";
import styles from "./styles.module.css";

export interface StatusBadgeProps {
  status: PrStatus;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const category = STATUS_CATEGORY[status];
  return (
    <span className={[styles.badge, styles[category]].join(" ")}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}
