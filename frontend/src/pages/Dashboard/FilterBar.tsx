import { PR_STATUSES, STATUS_LABELS, type PrStatus, type ReviewFilter } from "../../types";
import { Button } from "../../components/ui";
import styles from "./FilterBar.module.css";

export interface FilterBarProps {
  filter: ReviewFilter;
  onChange: (patch: Partial<ReviewFilter>) => void;
  onClear: () => void;
}

const SORT_OPTIONS: { value: NonNullable<ReviewFilter["sort"]>; label: string }[] = [
  { value: "updatedAt", label: "Last updated" },
  { value: "createdAt", label: "Created" },
  { value: "status", label: "Status" },
  { value: "raisedBy", label: "Raised by" },
  { value: "component", label: "Component" },
];

export function FilterBar({ filter, onChange, onClear }: FilterBarProps) {
  const selectedStatuses = new Set(filter.status ?? []);

  function toggleStatus(status: PrStatus) {
    const next = new Set(selectedStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    onChange({ status: next.size > 0 ? Array.from(next) : undefined, page: 0 });
  }

  return (
    <div className={styles.bar}>
      <div className={styles.field}>
        <label htmlFor="filter-component">Component</label>
        <input
          id="filter-component"
          value={filter.component ?? ""}
          onChange={(e) => onChange({ component: e.target.value || undefined, page: 0 })}
          placeholder="Any"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-raisedBy">Raised by</label>
        <input
          id="filter-raisedBy"
          value={filter.raisedBy ?? ""}
          onChange={(e) => onChange({ raisedBy: e.target.value || undefined, page: 0 })}
          placeholder="Any"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-reviewer">Reviewer</label>
        <input
          id="filter-reviewer"
          value={filter.reviewer ?? ""}
          onChange={(e) => onChange({ reviewer: e.target.value || undefined, page: 0 })}
          placeholder="Any"
        />
      </div>

      <fieldset className={styles.statusGroup}>
        <legend>Status</legend>
        <div className={styles.statusOptions}>
          {PR_STATUSES.map((status) => (
            <label key={status} className={styles.statusOption}>
              <input
                type="checkbox"
                checked={selectedStatuses.has(status)}
                onChange={() => toggleStatus(status)}
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.field}>
        <label htmlFor="filter-sort">Sort by</label>
        <select
          id="filter-sort"
          value={filter.sort ?? "updatedAt"}
          onChange={(e) => onChange({ sort: e.target.value as ReviewFilter["sort"] })}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="filter-direction">Direction</label>
        <select
          id="filter-direction"
          value={filter.direction ?? "DESC"}
          onChange={(e) => onChange({ direction: e.target.value as ReviewFilter["direction"] })}
        >
          <option value="DESC">Newest first</option>
          <option value="ASC">Oldest first</option>
        </select>
      </div>

      <div className={styles.spacer} />
      <Button type="button" variant="ghost" onClick={onClear}>
        Clear filters
      </Button>
    </div>
  );
}
