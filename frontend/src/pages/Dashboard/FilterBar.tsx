import { ArrowDownWideNarrow, ArrowUpWideNarrow, ChevronDown, Search, X } from "lucide-react";
import { type PrStatus, type ReviewFilter } from "../../types";
import { Button, Card, StatusMultiSelect } from "../../components/ui";
import styles from "./FilterBar.module.css";

export interface FilterBarProps {
  filter: ReviewFilter;
  hasActiveFilters: boolean;
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

function SearchField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.searchField}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.inputWrap}>
        <Search size={14} aria-hidden="true" />
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Any" />
      </div>
    </div>
  );
}

export function FilterBar({ filter, hasActiveFilters, onChange, onClear }: FilterBarProps) {
  const direction = filter.direction ?? "DESC";

  return (
    <Card className={styles.bar} role="search" aria-label="Filter pull requests">
      <SearchField
        id="filter-component"
        label="Component"
        value={filter.component ?? ""}
        onChange={(v) => onChange({ component: v || undefined, page: 0 })}
      />
      <SearchField
        id="filter-raisedBy"
        label="Raised by"
        value={filter.raisedBy ?? ""}
        onChange={(v) => onChange({ raisedBy: v || undefined, page: 0 })}
      />
      <SearchField
        id="filter-reviewer"
        label="Reviewer"
        value={filter.reviewer ?? ""}
        onChange={(v) => onChange({ reviewer: v || undefined, page: 0 })}
      />

      <StatusMultiSelect
        selected={filter.status ?? []}
        onChange={(status: PrStatus[]) => onChange({ status: status.length > 0 ? status : undefined, page: 0 })}
      />

      <div className={styles.spacer} />

      <div className={styles.sortField}>
        <label htmlFor="filter-sort">Sort by</label>
        <div className={styles.selectWrap}>
          <select
            id="filter-sort"
            value={filter.sort ?? "updatedAt"}
            onChange={(e) => onChange({ sort: e.target.value as ReviewFilter["sort"], page: 0 })}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </div>
      </div>

      <button
        type="button"
        className={styles.directionButton}
        onClick={() => onChange({ direction: direction === "DESC" ? "ASC" : "DESC", page: 0 })}
        aria-label={direction === "DESC" ? "Sorted newest first, click for oldest first" : "Sorted oldest first, click for newest first"}
      >
        {direction === "DESC" ? (
          <ArrowDownWideNarrow size={16} aria-hidden="true" />
        ) : (
          <ArrowUpWideNarrow size={16} aria-hidden="true" />
        )}
        {direction === "DESC" ? "Newest" : "Oldest"}
      </button>

      {hasActiveFilters && (
        <Button type="button" variant="ghost" onClick={onClear}>
          <X size={14} aria-hidden="true" />
          Clear filters
        </Button>
      )}
    </Card>
  );
}
