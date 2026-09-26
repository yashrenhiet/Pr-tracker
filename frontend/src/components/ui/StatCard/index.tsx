import type { ReactNode } from "react";
import { Skeleton } from "../Skeleton";
import styles from "./styles.module.css";

export interface StatCardProps {
  label: string;
  /** `undefined` = still loading (skeleton); `null` = failed to load (dash, not an endless shimmer). */
  value: number | null | undefined;
  tone?: "neutral" | "danger" | "success" | "info";
  icon: ReactNode;
  /** When set, the card becomes a toggle that filters the table. */
  onSelect?: () => void;
  selected?: boolean;
}

/** Summary metric. With `onSelect` it is a real `<button aria-pressed>`, not a clickable div, so
 * keyboard and screen-reader users get the same shortcut as mouse users. */
export function StatCard({ label, value, tone = "neutral", icon, onSelect, selected = false }: StatCardProps) {
  const content = (
    <>
      <span className={styles.iconBadge} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.text}>
        <span className={[styles.value, "tabular-nums"].join(" ")}>
          {value === undefined ? <Skeleton width={36} height={22} /> : (value ?? "—")}
        </span>
        <span className={styles.label}>{label}</span>
      </span>
    </>
  );
  const className = [styles.card, styles[tone], onSelect && styles.interactive, selected && styles.selected]
    .filter(Boolean)
    .join(" ");

  if (!onSelect) {
    return <div className={className}>{content}</div>;
  }
  return (
    <button type="button" className={className} onClick={onSelect} aria-pressed={selected}>
      {content}
    </button>
  );
}

export function StatCardRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section className={styles.row} aria-label={label}>
      {children}
    </section>
  );
}
