import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./styles.module.css";

export interface DrawerProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A side panel used for the add/edit forms. Not a full focus trap (no dependency for that), but it
 * covers the WCAG 2.2 essentials: labelled as a dialog, Escape closes it, focus moves in on open and
 * back to the trigger on close, and clicking the backdrop closes it without swallowing clicks meant
 * for the panel itself.
 */
export function Drawer({ title, onClose, children }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [onClose]);

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
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
