import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Plus, Rows3 } from "lucide-react";
import { useListReviewsQuery } from "../../store/api";
import type { ReviewFilter, ReviewResponse } from "../../types";
import { Button, StatCard, StatCardRow } from "../../components/ui";
import { FilterBar } from "./FilterBar";
import { ReviewsTable } from "./ReviewsTable";
import { AddReviewPanel } from "./AddReviewPanel";
import { ReviewDetailPanel } from "./ReviewDetailPanel";

const DEFAULT_FILTER: ReviewFilter = { page: 0, size: 20, sort: "updatedAt", direction: "DESC" };

/** A cheap way to get one number without a dedicated stats endpoint: ask for one row and read
 * `totalElements`. RTK Query caches identical queries, so this doesn't multiply real traffic. */
function useReviewCount(status?: ReviewFilter["status"]): number | undefined {
  return useListReviewsQuery({ status, size: 1 }).data?.totalElements;
}

function SummaryStats() {
  const total = useReviewCount();
  const readyForReview = useReviewCount(["READY_FOR_REVIEW"]);
  const blocked = useReviewCount(["BLOCKED"]);
  const merged = useReviewCount(["MERGED"]);

  return (
    <StatCardRow>
      <StatCard label="Total tracked" value={total} tone="neutral" icon={<Rows3 size={18} aria-hidden="true" />} />
      <StatCard
        label="Ready for review"
        value={readyForReview}
        tone="info"
        icon={<Clock size={18} aria-hidden="true" />}
      />
      <StatCard
        label="Blocked"
        value={blocked}
        tone="danger"
        icon={<AlertTriangle size={18} aria-hidden="true" />}
      />
      <StatCard
        label="Merged"
        value={merged}
        tone="success"
        icon={<CheckCircle2 size={18} aria-hidden="true" />}
      />
    </StatCardRow>
  );
}

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

      <SummaryStats />

      <FilterBar filter={filter} onChange={patchFilter} onClear={() => setFilter(DEFAULT_FILTER)} />

      <ReviewsTable
        page={data}
        isLoading={isFetching}
        onEdit={setEditing}
        onPageChange={(page) => patchFilter({ page })}
        onTrackFirst={() => setIsAdding(true)}
      />

      {isAdding && <AddReviewPanel onClose={() => setIsAdding(false)} onCreated={() => setIsAdding(false)} />}
      {editing && <ReviewDetailPanel review={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
