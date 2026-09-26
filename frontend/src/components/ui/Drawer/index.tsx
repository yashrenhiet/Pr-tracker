import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useModalBehavior } from "../../../hooks/useModalBehavior";
import styles from "./styles.module.css";

export interface DrawerProps {
  title: string;
  /** Secondary line under the title, e.g. the PR's repo path. */
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Pinned to the bottom of the panel so primary actions never scroll out of reach. */
  footer?: ReactNode;
}

/** Side panel for add/edit flows. Modal semantics (focus trap, Escape, scroll lock, focus restore)
 * come from `useModalBehavior`. */
export function Drawer({ title, subtitle, onClose, children, footer }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalBehavior(panelRef, onClose);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.heading}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close panel">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
