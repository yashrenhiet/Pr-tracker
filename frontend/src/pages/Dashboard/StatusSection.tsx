import { useState } from "react";
import { useChangeReviewStatusMutation } from "../../store/api";
import { fieldError, problemDetail } from "../../api/problemDetail";
import { PR_STATUSES, STATUS_LABELS, type PrStatus, type ReviewResponse } from "../../types";
import { Button, Select, StatusBadge, TextField, useToast } from "../../components/ui";
import { formatDateTime, formatRelative } from "../../utils/formatDate";
import styles from "./ReviewDetail.module.css";

/** Status changes are their own action (PUT /status), so they get their own section and button \u2014
 * never bundled into "Save details", which would make one click do two unrelated writes. */
export function StatusSection({ review }: { review: ReviewResponse }) {
  const { notify } = useToast();
  const [status, setStatus] = useState<PrStatus>(review.status);
  const [blockReason, setBlockReason] = useState(review.blockReason ?? "");
  const [changeStatus, { isLoading, error }] = useChangeReviewStatusMutation();

  const unchanged = status === review.status && (status !== "BLOCKED" || blockReason === (review.blockReason ?? ""));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await changeStatus({ id: review.id, body: { status, blockReason: blockReason || undefined } }).unwrap();
      notify("success", `Status set to ${STATUS_LABELS[status]}.`);
    } catch {
      notify("error", "Status wasn't updated.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.section} aria-labelledby="status-heading">
      <div className={styles.sectionHeader}>
        <h3 id="status-heading" className={styles.sectionTitle}>
          Status
        </h3>
        <span className={styles.meta}>
          <StatusBadge status={review.status} label={review.statusLabel} />
          <time dateTime={review.updatedAt} title={formatDateTime(review.updatedAt)}>
            updated {formatRelative(review.updatedAt)}
          </time>
        </span>
      </div>

      {error && !fieldError(error, "blockReason") && (
        <p role="alert" className={styles.errorBanner}>
          {problemDetail(error)}
        </p>
      )}

      <div className={styles.statusRow}>
        <Select
          label="Move to"
          value={status}
          onChange={(e) => setStatus(e.target.value as PrStatus)}
          options={PR_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
          error={fieldError(error, "status")}
        />
        <Button type="submit" variant="secondary" loading={isLoading} disabled={unchanged}>
          Update status
        </Button>
      </div>

      {status === "BLOCKED" && (
        <TextField
          label="What's blocking it?"
          required
          value={blockReason}
          onChange={(e) => setBlockReason(e.target.value)}
          hint="Shown on the dashboard so everyone knows why it's stuck."
          error={fieldError(error, "blockReason")}
        />
      )}
    </form>
  );
}
