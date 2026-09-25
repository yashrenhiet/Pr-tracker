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
  Card,
  Drawer,
  KeyValueEditor,
  Select,
  TagInput,
  TextArea,
  TextField,
  useToast,
} from "../../components/ui";

export interface ReviewDetailPanelProps {
  review: ReviewResponse;
  onClose: () => void;
}

const sectionStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-4)" };
const sectionHeadingStyle: React.CSSProperties = { fontSize: 14, margin: 0 };

export function ReviewDetailPanel({ review, onClose }: ReviewDetailPanelProps) {
  const { notify } = useToast();
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
      notify("success", "PR details saved.");
      onClose();
    } catch {
      notify("error", "Couldn't save PR details — see the error above.");
    }
  }

  async function handleStatusChange(event: React.FormEvent) {
    event.preventDefault();
    try {
      await changeStatus({ id: review.id, body: { status, blockReason: blockReason || undefined } }).unwrap();
      notify("success", `Status updated to ${STATUS_LABELS[status]}.`);
    } catch {
      notify("error", "Couldn't update status — see the error above.");
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Stop tracking ${review.prUrl}? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteReview(review.id).unwrap();
      notify("success", "Stopped tracking that PR.");
      onClose();
    } catch {
      notify("error", "Couldn't stop tracking that PR. Try again.");
    }
  }

  return (
    <Drawer title={`PR #${review.id}`} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Card style={sectionStyle}>
          <h3 id="status-heading" style={sectionHeadingStyle}>
            Status
          </h3>
          {statusError && (
            <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
              {problemDetail(statusError)}
            </p>
          )}
          <form onSubmit={handleStatusChange} aria-labelledby="status-heading" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
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
              Update status only
            </Button>
          </form>
        </Card>

        <Card style={sectionStyle}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h3 style={sectionHeadingStyle}>Details</h3>
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
                Save details
              </Button>
            </div>
          </div>
          </form>
        </Card>
      </div>
    </Drawer>
  );
}
