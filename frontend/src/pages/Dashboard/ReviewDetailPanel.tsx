import { SearchX } from "lucide-react";
import { useGetReviewQuery, useUpdateReviewMutation } from "../../store/api";
import { Button, Drawer, Skeleton, StatePanel } from "../../components/ui";
import { prIdentity } from "../../utils/prUrl";
import { ReviewDetailForm } from "./ReviewDetailForm";
import { DETAILS_FORM_ID, detailsSaveKey } from "./reviewDetailKeys";
import { StatusSection } from "./StatusSection";
import styles from "./ReviewDetail.module.css";

export interface ReviewDetailPanelProps {
  reviewId: number;
  onClose: () => void;
}

function LoadingBody() {
  return (
    <div className={styles.loading} aria-busy="true" aria-label="Loading pull request">
      <Skeleton width="40%" height={14} />
      <Skeleton height={38} />
      <Skeleton width="30%" height={14} />
      <Skeleton height={38} />
      <Skeleton height={90} />
    </div>
  );
}

/**
 * Loads its own record by id rather than being handed one from the table: a `?review=` deep link
 * works even when that PR isn't on the current page, and a status change is reflected here the
 * moment the server confirms it.
 */
export function ReviewDetailPanel({ reviewId, onClose }: ReviewDetailPanelProps) {
  const { data: review, isLoading, isError } = useGetReviewQuery(reviewId);
  const [, { isLoading: isSaving }] = useUpdateReviewMutation({ fixedCacheKey: detailsSaveKey(reviewId) });
  const identity = review ? prIdentity(review.prUrl) : null;

  const footer = review && (
    <>
      <span />
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={DETAILS_FORM_ID} variant="primary" loading={isSaving}>
          Save changes
        </Button>
      </div>
    </>
  );

  return (
    <Drawer
      title={identity?.number ? `Pull request ${identity.number}` : "Pull request"}
      subtitle={identity?.repo}
      onClose={onClose}
      footer={footer}
    >
      {isLoading && <LoadingBody />}
      {isError && !review && (
        <StatePanel
          tone="error"
          icon={<SearchX size={24} />}
          title="This pull request isn't available"
          description="It may have been removed, or the link is out of date."
          action={
            <Button type="button" variant="secondary" onClick={onClose}>
              Back to dashboard
            </Button>
          }
        />
      )}
      {review && (
        <>
          <StatusSection key={`status-${review.version}`} review={review} />
          <ReviewDetailForm review={review} onClose={onClose} />
        </>
      )}
    </Drawer>
  );
}
