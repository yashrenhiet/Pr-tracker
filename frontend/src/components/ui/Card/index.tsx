import type { HTMLAttributes } from "react";
import styles from "./styles.module.css";

/** A plain elevated surface. Gives the filter bar, table and reviewer rows visual weight instead of
 * floating unbounded on the page background. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={[styles.card, className].filter(Boolean).join(" ")} {...rest} />;
}
