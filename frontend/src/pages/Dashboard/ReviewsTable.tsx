import { ChevronLeft, ChevronRight, CloudOff, ExternalLink, GitPullRequestArrow, RefreshCw, SearchX } from "lucide-react";
import type { PageResponse, ReviewResponse } from "../../types";
import { AvatarStack, Avatar, Button, Card, Skeleton, StatePanel, StatusBadge } from "../../components/ui";
import { loadErrorMessage } from "../../api/problemDetail";
import { formatDateTime, formatRelative } from "../../utils/formatDate";
import { prIdentity } from "../../utils/prUrl";
import styles from "./ReviewsTable.module.css";

export interface ReviewsTableProps {
  page?: PageResponse<ReviewResponse>;
  /** First load, nothing to show yet. */
  isLoading: boolean;
  /** Any request in flight, including a refetch behind already-visible rows. */
  isFetching: boolean;
  error?: unknown;
  hasActiveFilters: boolean;
  onOpen: (id: number) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onTrackFirst: () => void;
  onRetry: () => void;
}

const COLUMNS = ["Pull request", "Component", "Status", "Raised by", "Reviewers", "Updated"];
const SKELETON_ROWS = 5;

function reviewerPeople(review: ReviewResponse) {
  return [
    ...review.internalReviewers.map((name) => ({ name, title: `${name} (internal)` })),
    ...review.platformReviewers.map((name) => ({ name, title: `${name} (platform)` })),
  ];
}

function ReviewRow({ review, onOpen }: { review: ReviewResponse; onOpen: (id: number) => void }) {
  const { repo, number } = prIdentity(review.prUrl);
  const people = reviewerPeople(review);
  return (
    // Whole-row click is a mouse convenience; the title button is the keyboard/AT path to the same action.
    <tr className={styles.row} onClick={() => onOpen(review.id)}>
      <td>
        <div className={styles.prCell}>
          <button
            type="button"
            className={styles.prTitle}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(review.id);
            }}
          >
            {number ?? "Pull request"}
            <span className="visually-hidden">in {repo}, open details</span>
          </button>
          <a
            className={styles.prRepo}
            href={review.prUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {repo}
            <ExternalLink size={11} aria-hidden="true" />
            <span className="visually-hidden">(opens GitHub in a new tab)</span>
          </a>
        </div>
      </td>
      <td data-label="Component">
        <span className={styles.componentTag}>{review.component}</span>
      </td>
      <td data-label="Status">
        <StatusBadge status={review.status} label={review.statusLabel} />
        {review.status === "BLOCKED" && review.blockReason && (
          <span className={styles.blockReason} title={review.blockReason}>
            {review.blockReason}
          </span>
        )}
      </td>
      <td data-label="Raised by">
        <span className={styles.person}>
          <Avatar name={review.raisedBy} />
          {review.raisedBy}
        </span>
      </td>
      <td data-label="Reviewers">
        {people.length === 0 ? (
          <span className={styles.muted}>Unassigned</span>
        ) : (
          <span className={styles.person}>
            <AvatarStack people={people} />
            <span className="visually-hidden">{people.map((p) => p.title).join(", ")}</span>
          </span>
        )}
      </td>
      <td className={styles.time} data-label="Updated">
        <time dateTime={review.updatedAt} title={formatDateTime(review.updatedAt)}>
          {formatRelative(review.updatedAt)}
        </time>
      </td>
      <td className={styles.chevron} aria-hidden="true">
        <ChevronRight size={16} />
      </td>
    </tr>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }, (_, i) => (
        <tr key={i} className={styles.skeletonRow}>
          <td>
            <Skeleton width={70} height={14} />
            <div style={{ height: 6 }} />
            <Skeleton width={140} height={11} />
          </td>
          <td><Skeleton width={60} height={20} /></td>
          <td><Skeleton width={96} height={22} /></td>
          <td><Skeleton width={90} height={20} /></td>
          <td><Skeleton width={60} height={26} /></td>
          <td><Skeleton width={80} height={12} /></td>
          <td />
        </tr>
      ))}
    </>
  );
}

function EmptyOrErrorState(props: Pick<ReviewsTableProps, "error" | "hasActiveFilters" | "onClearFilters" | "onTrackFirst" | "onRetry">) {
  if (props.error) {
    return (
      <StatePanel
        tone="error"
        icon={<CloudOff size={24} />}
        title="We couldn't load your pull requests"
        description={loadErrorMessage(props.error)}
        action={
          <Button type="button" variant="secondary" onClick={props.onRetry}>
            <RefreshCw size={16} aria-hidden="true" />
            Try again
          </Button>
        }
      />
    );
  }
  if (props.hasActiveFilters) {
    return (
      <StatePanel
        icon={<SearchX size={24} />}
        title="No pull requests match these filters"
        description="Try a broader search, or clear the filters to see everything you're tracking."
        action={
          <Button type="button" variant="secondary" onClick={props.onClearFilters}>
            Clear all filters
          </Button>
        }
      />
    );
  }
  return (
    <StatePanel
      icon={<GitPullRequestArrow size={24} />}
      title="Start tracking your first pull request"
      description="Paste a GitHub PR link to follow its review status, reviewers and blockers in one place."
      action={
        <Button type="button" variant="primary" onClick={props.onTrackFirst}>
          Track a PR
        </Button>
      }
    />
  );
}

export function ReviewsTable(props: ReviewsTableProps) {
  const { page, isLoading, isFetching, error, onOpen, onPageChange } = props;

  // A failed refetch keeps stale rows on screen (RTK Query keeps `data`), but a failure with nothing
  // to show must say so. The old table rendered "no PRs match" when the server was down.
  const showStatePanel = !isLoading && (page ? page.content.length === 0 : Boolean(error));
  if (showStatePanel) {
    return (
      <Card>
        <EmptyOrErrorState {...props} />
      </Card>
    );
  }

  const first = page ? page.page * page.size + 1 : 0;
  const last = page ? first + page.content.length - 1 : 0;

  return (
    <Card className={styles.card}>
      <div
        className={[styles.tableWrap, isFetching && !isLoading && styles.refetching].filter(Boolean).join(" ")}
        aria-busy={isFetching}
      >
        <table className={styles.table}>
          <caption className="visually-hidden">Tracked pull requests</caption>
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
              <th scope="col">
                <span className="visually-hidden">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading || !page ? <SkeletonRows /> : page.content.map((r) => <ReviewRow key={r.id} review={r} onOpen={onOpen} />)}
          </tbody>
        </table>
      </div>

      {page && page.totalElements > 0 && (
        <nav className={styles.footer} aria-label="Pagination">
          <span className="tabular-nums" aria-live="polite">
            Showing {first}–{last} of {page.totalElements}
          </span>
          <div className={styles.pager}>
            <Button type="button" variant="secondary" disabled={page.page === 0} onClick={() => onPageChange(page.page - 1)}>
              <ChevronLeft size={16} aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page.page + 1 >= page.totalPages}
              onClick={() => onPageChange(page.page + 1)}
            >
              Next
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </Card>
  );
}
