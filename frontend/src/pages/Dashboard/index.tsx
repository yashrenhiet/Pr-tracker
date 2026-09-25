import { useState } from "react";
import { Plus } from "lucide-react";
import { useListReviewsQuery } from "../../store/api";
import type { ReviewFilter, ReviewResponse } from "../../types";
import { Button } from "../../components/ui";
import { FilterBar } from "./FilterBar";
import { ReviewsTable } from "./ReviewsTable";
import { AddReviewPanel } from "./AddReviewPanel";
import { ReviewDetailPanel } from "./ReviewDetailPanel";

const DEFAULT_FILTER: ReviewFilter = { page: 0, size: 20, sort: "updatedAt", direction: "DESC" };

export function DashboardPage() {
  const [filter, setFilter] = useState<ReviewFilter>(DEFAULT_FILTER);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState<ReviewResponse | null>(null);

  const { data, isFetching } = useListReviewsQuery(filter);

  function patchFilter(patch: Partial<ReviewFilter>) {
    setFilter((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h1>Tracked pull requests</h1>
        <Button type="button" variant="primary" onClick={() => setIsAdding(true)}>
          <Plus size={16} aria-hidden="true" />
          Track a PR
        </Button>
      </div>

      <FilterBar filter={filter} onChange={patchFilter} onClear={() => setFilter(DEFAULT_FILTER)} />

      <ReviewsTable
        page={data}
        isLoading={isFetching}
        onEdit={setEditing}
        onPageChange={(page) => patchFilter({ page })}
      />

      {isAdding && <AddReviewPanel onClose={() => setIsAdding(false)} onCreated={() => setIsAdding(false)} />}
      {editing && <ReviewDetailPanel review={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
