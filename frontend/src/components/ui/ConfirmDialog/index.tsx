import { useId, useRef, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useModalBehavior } from "../../../hooks/useModalBehavior";
import { Button } from "../Button";
import styles from "./styles.module.css";

export interface ConfirmDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Replaces `window.confirm()`, which renders unbranded browser chrome, can't be styled, and on a
 * customer-facing destructive action reads as broken. `alertdialog` role plus initial focus on
 * Cancel, so an accidental Enter doesn't delete anything.
 */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  const titleId = useId();
  const bodyId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalBehavior(panelRef, onCancel);

  return (
    <div className={styles.backdrop} onClick={onCancel}>
      <div
        ref={panelRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.iconBadge}>
          <AlertTriangle size={20} aria-hidden="true" />
        </span>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={bodyId} className={styles.body}>
          {children}
        </p>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onCancel} data-autofocus>
            Cancel
          </Button>
          <Button type="button" variant="dangerSolid" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
