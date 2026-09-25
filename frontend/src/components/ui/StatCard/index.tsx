import type { ReactNode } from "react";
import { Card } from "../Card";
import styles from "./styles.module.css";

export interface StatCardProps {
  label: string;
  value: number | undefined;
  tone?: "neutral" | "danger" | "success" | "info";
}

export function StatCard({ label, value, tone = "neutral" }: StatCardProps) {
  return (
    <Card className={[styles.card, styles[tone]].join(" ")}>
      <span className={styles.value}>{value ?? "—"}</span>
      <span className={styles.label}>{label}</span>
    </Card>
  );
}

export function StatCardRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
