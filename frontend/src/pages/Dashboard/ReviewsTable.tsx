import { ExternalLink, Inbox } from "lucide-react";
import type { PageResponse, ReviewResponse } from "../../types";
import { Button, Card, Spinner, StatusBadge } from "../../components/ui";
import { formatDateTime, formatRelative } from "../../utils/formatDate";
import styles from "./ReviewsTable.module.css";

export interface ReviewsTableProps {
  page?: PageResponse<ReviewResponse>;
  isLoading: boolean;
  onEdit: (review: ReviewResponse) => void;
  onPageChange: (page: number) => void;
  onTrackFirst: () => void;
}

function ReviewersCell({ review }: { review: ReviewResponse }) {
  if (review.internalReviewers.length === 0 && review.platformReviewers.length === 0) {
    return <span className={styles.reviewers}>Unassigned</span>;
  }
  return (
    <div className={styles.reviewers}>
      {review.internalReviewers.length > 0 && <span>Internal: {review.internalReviewers.join(", ")}</span>}
      {review.platformReviewers.length > 0 && <span>Platform: {review.platformReviewers.join(", ")}</span>}
    </div>
  );
}

export function ReviewsTable({ page, isLoading, onEdit, onPageChange, onTrackFirst }: ReviewsTableProps) {
  if (isLoading && !page) {
    return (
      <Card className={styles.emptyState}>
        <Spinner label="Loading reviews" />
      </Card>
    );
  }

  if (!page || page.content.length === 0) {
    return (
      <Card className={styles.emptyState}>
        <Inbox size={32} aria-hidden="true" />
        <span className={styles.emptyTitle}>No PRs match these filters yet</span>
        <span>Try clearing a filter, or track your first PR to get started.</span>
        <Button type="button" variant="primary" onClick={onTrackFirst}>
          Track a PR
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="visually-hidden">Tracked pull requests</caption>
          <thead>
            <tr>
              <th scope="col">Pull request</th>
              <th scope="col">Component</th>
              <th scope="col">Status</th>
              <th scope="col">Raised by</th>
              <th scope="col">Reviewers</th>
              <th scope="col">Updated</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {page.content.map((review) => (
              <tr key={review.id}>
                <td>
                  <a href={review.prUrl} target="_blank" rel="noreferrer" className={styles.prLink}>
                    {review.prUrl.replace("https://github.com/", "")}
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </td>
                <td>{review.component}</td>
                <td>
                  <StatusBadge status={review.status} label={review.statusLabel} />
                  {review.status === "BLOCKED" && review.blockReason && (
                    <span className={styles.blockReason}>{review.blockReason}</span>
                  )}
                </td>
                <td>{review.raisedBy}</td>
                <td>
                  <ReviewersCell review={review} />
                </td>
                <td title={formatDateTime(review.updatedAt)}>{formatRelative(review.updatedAt)}</td>
                <td>
                  <Button type="button" variant="ghost" onClick={() => onEdit(review)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav className={styles.pagination} aria-label="Pagination">
        <Button
          type="button"
          variant="secondary"
          disabled={page.page === 0}
          onClick={() => onPageChange(page.page - 1)}
        >
          Previous
        </Button>
        <span>
          Page {page.page + 1} of {Math.max(page.totalPages, 1)} · {page.totalElements} total
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={page.page + 1 >= page.totalPages}
          onClick={() => onPageChange(page.page + 1)}
        >
          Next
        </Button>
      </nav>
    </Card>
  );
}
