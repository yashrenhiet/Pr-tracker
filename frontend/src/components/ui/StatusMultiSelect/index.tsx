import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { PR_STATUSES, STATUS_LABELS, type PrStatus } from "../../../types";
import styles from "./styles.module.css";

export interface StatusMultiSelectProps {
  selected: PrStatus[];
  onChange: (statuses: PrStatus[]) => void;
}

/**
 * Replaces a wall of 11 always-visible checkboxes with a closed-by-default dropdown — the filter
 * you touch least often shouldn't be the thing that dominates the page. Built on native
 * `<details>/<summary>` rather than a hand-rolled popover: free keyboard support (Enter/Space
 * toggles, it's a real disclosure widget) and no focus-trap code to get wrong.
 */
export function StatusMultiSelect({ selected, onChange }: StatusMultiSelectProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedSet = new Set(selected);

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (detailsRef.current?.open && !detailsRef.current.contains(event.target as Node)) {
        detailsRef.current.open = false;
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
      }
    }
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function toggle(status: PrStatus) {
    const next = new Set(selectedSet);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    onChange(Array.from(next));
  }

  return (
    <details ref={detailsRef} className={styles.wrapper}>
      <summary className={styles.summary}>
        <span className={styles.trigger}>
          Status
          {selected.length > 0 && <span className={styles.count}>{selected.length}</span>}
          <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
        </span>
      </summary>
      <div className={styles.panel} role="group" aria-label="Filter by status">
        {PR_STATUSES.map((status) => (
          <label key={status} className={styles.option}>
            <input type="checkbox" checked={selectedSet.has(status)} onChange={() => toggle(status)} />
            {STATUS_LABELS[status]}
          </label>
        ))}
        {selected.length > 0 && (
          <div className={styles.footer}>
            <button type="button" className={styles.clearLink} onClick={() => onChange([])}>
              Clear status
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
