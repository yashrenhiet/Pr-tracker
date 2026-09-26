import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Plus, Rows3 } from "lucide-react";
import { useListReviewsQuery } from "../../store/api";
import type { PrStatus } from "../../types";
import { Button, PageHeader, StatCard, StatCardRow } from "../../components/ui";
import { FilterBar } from "./FilterBar";
import { ReviewsTable } from "./ReviewsTable";
import { AddReviewPanel } from "./AddReviewPanel";
import { ReviewDetailPanel } from "./ReviewDetailPanel";
import { useReviewFilterParams } from "./useReviewFilterParams";

/** One number without a stats endpoint: ask for a single row and read `totalElements`.
 * `null` on failure so the card shows a dash instead of shimmering forever. */
function useReviewCount(status?: PrStatus): number | null | undefined {
  const { data, isError } = useListReviewsQuery({ status: status ? [status] : undefined, size: 1 });
  return data?.totalElements ?? (isError ? null : undefined);
}

const QUICK_FILTERS: { status: PrStatus; label: string; tone: "info" | "danger" | "success"; icon: React.ReactNode }[] = [
  { status: "READY_FOR_REVIEW", label: "Ready for review", tone: "info", icon: <Clock size={20} /> },
  { status: "BLOCKED", label: "Blocked", tone: "danger", icon: <AlertTriangle size={20} /> },
  { status: "MERGED", label: "Merged", tone: "success", icon: <CheckCircle2 size={20} /> },
];

function QuickFilterCard({
  status,
  label,
  tone,
  icon,
  selected,
  onToggle,
}: (typeof QUICK_FILTERS)[number] & { selected: boolean; onToggle: () => void }) {
  const count = useReviewCount(status);
  return <StatCard label={label} value={count} tone={tone} icon={icon} selected={selected} onSelect={onToggle} />;
}

export function DashboardPage() {
  const [isAdding, setIsAdding] = useState(false);
  const { filter, queryFilter, hasActiveFilters, patchFilter, clearFilters, selectedId, selectReview } =
    useReviewFilterParams();
  const total = useReviewCount();
  const { data, isLoading, isFetching, error, refetch } = useListReviewsQuery(queryFilter);

  const onlyStatus = filter.status?.length === 1 ? filter.status[0] : undefined;
  function toggleStatus(status: PrStatus) {
    patchFilter({ status: onlyStatus === status ? undefined : [status], page: 0 });
  }

  return (
    <>
      <PageHeader
        title="Pull requests"
        description="Every PR your team is tracking, with its review status and who's on it."
        actions={
          <Button type="button" variant="primary" onClick={() => setIsAdding(true)}>
            <Plus size={16} aria-hidden="true" />
            Track a PR
          </Button>
        }
      />

      <StatCardRow label="Summary">
        <StatCard label="Total tracked" value={total} tone="neutral" icon={<Rows3 size={20} />} />
        {QUICK_FILTERS.map((q) => (
          <QuickFilterCard key={q.status} {...q} selected={onlyStatus === q.status} onToggle={() => toggleStatus(q.status)} />
        ))}
      </StatCardRow>

      <FilterBar filter={filter} hasActiveFilters={hasActiveFilters} onChange={patchFilter} onClear={clearFilters} />

      <ReviewsTable
        page={data}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onOpen={selectReview}
        onPageChange={(page) => patchFilter({ page })}
        onClearFilters={clearFilters}
        onTrackFirst={() => setIsAdding(true)}
        onRetry={refetch}
      />

      {isAdding && (
        <AddReviewPanel
          onClose={() => setIsAdding(false)}
          onCreated={(id) => {
            setIsAdding(false);
            selectReview(id);
          }}
        />
      )}
      {selectedId !== null && <ReviewDetailPanel reviewId={selectedId} onClose={() => selectReview(null)} />}
    </>
  );
}
