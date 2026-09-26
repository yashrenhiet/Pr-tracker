import styles from "./styles.module.css";

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
}

/** Placeholder block with the shape of the content that's coming. The layout doesn't jump when the
 * data lands, which a lone centred spinner can't promise. Purely decorative, so hidden from AT —
 * the surrounding container carries `aria-busy`. */
export function Skeleton({ width = "100%", height = 14 }: SkeletonProps) {
  return <span className={styles.skeleton} style={{ width, height }} aria-hidden="true" />;
}
