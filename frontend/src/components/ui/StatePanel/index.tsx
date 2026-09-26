import type { ReactNode } from "react";
import styles from "./styles.module.css";

export interface StatePanelProps {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
}

/** Empty, error and not-found states share one layout, so none of them look like an afterthought.
 * Errors use `role="alert"`, since the customer needs to hear that something failed. */
export function StatePanel({ icon, title, description, action, tone = "neutral" }: StatePanelProps) {
  return (
    <div className={styles.panel} role={tone === "error" ? "alert" : undefined}>
      <span className={[styles.iconBadge, styles[tone]].join(" ")} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  );
}
