import type { PageResponse, ReviewResponse } from "../../types";
import { Button, Spinner, StatusBadge } from "../../components/ui";
import { formatDateTime } from "../../utils/formatDate";
import styles from "./ReviewsTable.module.css";

export interface ReviewsTableProps {
  page?: PageResponse<ReviewResponse>;
  isLoading: boolean;
  onEdit: (review: ReviewResponse) => void;
  onPageChange: (page: number) => void;
}

export function ReviewsTable({ page, isLoading, onEdit, onPageChange }: ReviewsTableProps) {
  if (isLoading && !page) {
    return (
      <div className={styles.emptyState}>
        <Spinner label="Loading reviews" />
      </div>
    );
  }

  if (!page || page.content.length === 0) {
    return <div className={styles.emptyState}>No PRs match these filters yet.</div>;
  }

  return (
    <>
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
                </a>
              </td>
              <td>{review.component}</td>
              <td>
                <StatusBadge status={review.status} label={review.statusLabel} />
                {review.status === "BLOCKED" && review.blockReason && (
                  <div className={styles.reviewers}>{review.blockReason}</div>
                )}
              </td>
              <td>{review.raisedBy}</td>
              <td>
                <div className={styles.reviewers}>
                  {review.internalReviewers.length > 0 && <span>Internal: {review.internalReviewers.join(", ")}</span>}
                  {review.platformReviewers.length > 0 && <span>Platform: {review.platformReviewers.join(", ")}</span>}
                  {review.internalReviewers.length === 0 && review.platformReviewers.length === 0 && "—"}
                </div>
              </td>
              <td>{formatDateTime(review.updatedAt)}</td>
              <td>
                <Button type="button" variant="ghost" onClick={() => onEdit(review)}>
                  Edit
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
    </>
  );
}
