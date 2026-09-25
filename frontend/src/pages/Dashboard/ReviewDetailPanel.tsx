import { useState } from "react";
import {
  useChangeReviewStatusMutation,
  useDeleteReviewMutation,
  useListComponentsQuery,
  useUpdateReviewMutation,
} from "../../store/api";
import { fieldError, problemDetail } from "../../api/problemDetail";
import { PR_STATUSES, STATUS_LABELS, type PrStatus, type ReviewResponse } from "../../types";
import {
  Button,
  Drawer,
  KeyValueEditor,
  Select,
  TagInput,
  TextArea,
  TextField,
} from "../../components/ui";

export interface ReviewDetailPanelProps {
  review: ReviewResponse;
  onClose: () => void;
}

export function ReviewDetailPanel({ review, onClose }: ReviewDetailPanelProps) {
  const [component, setComponent] = useState(review.component);
  const [raisedBy, setRaisedBy] = useState(review.raisedBy);
  const [context, setContext] = useState(review.context ?? "");
  const [internalReviewers, setInternalReviewers] = useState(review.internalReviewers);
  const [platformReviewers, setPlatformReviewers] = useState(review.platformReviewers);
  const [metadata, setMetadata] = useState(review.metadata);

  const [status, setStatus] = useState<PrStatus>(review.status);
  const [blockReason, setBlockReason] = useState(review.blockReason ?? "");

  const { data: components = [] } = useListComponentsQuery();
  const [updateReview, { isLoading: isSaving, error: saveError }] = useUpdateReviewMutation();
  const [changeStatus, { isLoading: isChangingStatus, error: statusError }] =
    useChangeReviewStatusMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateReview({
        id: review.id,
        body: { component, raisedBy, context, internalReviewers, platformReviewers, metadata, version: review.version },
      }).unwrap();
      onClose();
    } catch {
      // Surfaced via `saveError` below.
    }
  }

  async function handleStatusChange(event: React.FormEvent) {
    event.preventDefault();
    try {
      await changeStatus({ id: review.id, body: { status, blockReason: blockReason || undefined } }).unwrap();
    } catch {
      // Surfaced via `statusError` below.
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Stop tracking ${review.prUrl}? This cannot be undone.`)) {
      return;
    }
    await deleteReview(review.id).unwrap();
    onClose();
  }

  return (
    <Drawer title={`PR #${review.id}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <section aria-labelledby="status-heading" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <h3 id="status-heading" style={{ fontSize: 14 }}>
            Status
          </h3>
          {statusError && (
            <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
              {problemDetail(statusError)}
            </p>
          )}
          <form onSubmit={handleStatusChange} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Select
              label="Current status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PrStatus)}
              options={PR_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))}
              error={fieldError(statusError, "status")}
            />
            {status === "BLOCKED" && (
              <TextField
                label="Block reason"
                required
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                error={fieldError(statusError, "blockReason")}
              />
            )}
            <Button type="submit" variant="secondary" loading={isChangingStatus}>
              Update status
            </Button>
          </form>
        </section>

        <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h3 style={{ fontSize: 14 }}>Details</h3>
          {saveError && (
            <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
              {problemDetail(saveError)}
            </p>
          )}

          <TextField label="PR URL" value={review.prUrl} readOnly disabled hint="URLs can't be changed after tracking starts" />

          <TextField
            label="Component"
            required
            list="component-suggestions"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            error={fieldError(saveError, "component")}
          />
          <datalist id="component-suggestions">
            {components.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <TextField
            label="Raised by"
            required
            value={raisedBy}
            onChange={(e) => setRaisedBy(e.target.value)}
            error={fieldError(saveError, "raisedBy")}
          />

          <TextArea
            label="Context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            error={fieldError(saveError, "context")}
          />

          <TagInput label="Internal reviewers" values={internalReviewers} onChange={setInternalReviewers} />
          <TagInput label="Platform reviewers" values={platformReviewers} onChange={setPlatformReviewers} />
          <KeyValueEditor label="Metadata" values={metadata} onChange={setMetadata} />

          <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-2)" }}>
            <Button type="button" variant="danger" onClick={handleDelete} loading={isDeleting}>
              Stop tracking
            </Button>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={isSaving}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Drawer>
  );
}
