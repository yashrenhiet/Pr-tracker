import { useMemo, useState } from "react";
import { CloudOff, Plus, RefreshCw, Search, SearchX, Trash2, Users } from "lucide-react";
import { useDeleteReviewerMutation, useListReviewersQuery } from "../../store/api";
import { loadErrorMessage } from "../../api/problemDetail";
import type { ReviewerResponse } from "../../types";
import { Avatar, Button, Card, ConfirmDialog, PageHeader, Skeleton, StatePanel, useToast } from "../../components/ui";
import { AddReviewerPanel } from "./AddReviewerPanel";
import { ReviewerComponents } from "./ReviewerComponents";
import styles from "./styles.module.css";

function matches(reviewer: ReviewerResponse, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [reviewer.name, reviewer.email, reviewer.handle, ...reviewer.components].some((v) => v.toLowerCase().includes(q));
}

function LoadingCards() {
  return (
    <div className={styles.grid} aria-busy="true" aria-label="Loading reviewers">
      {[0, 1, 2].map((i) => (
        <Card key={i} className={styles.reviewerCard}>
          <div className={styles.header}>
            <Skeleton width={40} height={40} />
            <div style={{ flex: 1, display: "grid", gap: 6 }}>
              <Skeleton width="50%" height={14} />
              <Skeleton width="70%" height={11} />
            </div>
          </div>
          <Skeleton width="35%" height={22} />
        </Card>
      ))}
    </div>
  );
}

export function ReviewersPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ReviewerResponse | null>(null);
  const { data: reviewers, isLoading, error, refetch, isFetching } = useListReviewersQuery();
  const [deleteReviewer, { isLoading: isDeleting }] = useDeleteReviewerMutation();
  const { notify } = useToast();

  const visible = useMemo(() => (reviewers ?? []).filter((r) => matches(r, query)), [reviewers, query]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteReviewer(pendingDelete.id).unwrap();
      notify("success", `Removed ${pendingDelete.name}.`);
    } catch {
      notify("error", `Couldn't remove ${pendingDelete.name}. Please try again.`);
    } finally {
      setPendingDelete(null);
    }
  }

  function renderBody() {
    if (isLoading) return <LoadingCards />;
    if (error && !reviewers) {
      return (
        <Card>
          <StatePanel
            tone="error"
            icon={<CloudOff size={24} />}
            title="We couldn't load reviewers"
            description={loadErrorMessage(error)}
            action={
              <Button type="button" variant="secondary" onClick={refetch} loading={isFetching}>
                <RefreshCw size={16} aria-hidden="true" />
                Try again
              </Button>
            }
          />
        </Card>
      );
    }
    if (!reviewers || reviewers.length === 0) {
      return (
        <Card>
          <StatePanel
            icon={<Users size={24} />}
            title="Add your first reviewer"
            description="Reviewers are the people who can pick up PRs, scoped to the components they know."
            action={
              <Button type="button" variant="primary" onClick={() => setIsAdding(true)}>
                Add reviewer
              </Button>
            }
          />
        </Card>
      );
    }
    if (visible.length === 0) {
      return (
        <Card>
          <StatePanel
            icon={<SearchX size={24} />}
            title={`No reviewers match "${query.trim()}"`}
            description="Search covers names, emails, handles and components."
            action={
              <Button type="button" variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            }
          />
        </Card>
      );
    }
    return (
      <ul className={styles.grid}>
        {visible.map((reviewer) => (
          <li key={reviewer.id}>
            <Card className={styles.reviewerCard}>
              <div className={styles.header}>
                <Avatar name={reviewer.name} size="md" />
                <div className={styles.identity}>
                  <span className={styles.name}>{reviewer.name}</span>
                  <span className={styles.sub}>
                    <span className={styles.handle}>@{reviewer.handle}</span>
                    <a className={styles.email} href={`mailto:${reviewer.email}`}>
                      {reviewer.email}
                    </a>
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPendingDelete(reviewer)}
                  aria-label={`Remove ${reviewer.name}`}
                  title={`Remove ${reviewer.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
              <ReviewerComponents reviewer={reviewer} />
            </Card>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <PageHeader
        title="Reviewers"
        description="People who review PRs, and the components each of them covers."
        actions={
          <Button type="button" variant="primary" onClick={() => setIsAdding(true)}>
            <Plus size={16} aria-hidden="true" />
            Add reviewer
          </Button>
        }
      />

      {reviewers && reviewers.length > 0 && (
        <div className={styles.toolbar} role="search">
          <label htmlFor="reviewer-search" className="visually-hidden">
            Search reviewers
          </label>
          <div className={styles.searchWrap}>
            <Search size={15} aria-hidden="true" />
            <input
              id="reviewer-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, handle or component"
            />
          </div>
          <span className={`${styles.count} tabular-nums`} aria-live="polite">
            {visible.length} of {reviewers.length}
          </span>
        </div>
      )}

      {renderBody()}

      {isAdding && <AddReviewerPanel onClose={() => setIsAdding(false)} />}
      {pendingDelete && (
        <ConfirmDialog
          title={`Remove ${pendingDelete.name}?`}
          confirmLabel="Remove reviewer"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
          loading={isDeleting}
        >
          They&apos;ll lose access to{" "}
          {pendingDelete.components.length > 0 ? pendingDelete.components.join(", ") : "all components"}. PRs they were
          reviewing stay tracked.
        </ConfirmDialog>
      )}
    </>
  );
}
