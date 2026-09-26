import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import {
  useDeleteReviewMutation,
  useGetReviewQuery,
  useListComponentsQuery,
  useUpdateReviewMutation,
} from "../../store/api";
import { fieldError, isConflict, problemDetail } from "../../api/problemDetail";
import type { ReviewResponse } from "../../types";
import { Button, ConfirmDialog, KeyValueEditor, TagInput, TextArea, TextField, useToast } from "../../components/ui";
import { prLabel } from "../../utils/prUrl";
import { DETAILS_FORM_ID, detailsSaveKey } from "./reviewDetailKeys";
import styles from "./ReviewDetail.module.css";

export interface ReviewDetailFormProps {
  review: ReviewResponse;
  onClose: () => void;
}

/**
 * Edits are held locally and are NOT reset when the record's version changes: a status update from
 * the section above bumps the version, and throwing away what the user had typed would be worse
 * than the 409 it avoids. `review.version` always comes from the live cache, so saves send the
 * current version.
 */
export function ReviewDetailForm({ review, onClose }: ReviewDetailFormProps) {
  const { notify } = useToast();
  const [component, setComponent] = useState(review.component);
  const [raisedBy, setRaisedBy] = useState(review.raisedBy);
  const [context, setContext] = useState(review.context ?? "");
  const [internalReviewers, setInternalReviewers] = useState(review.internalReviewers);
  const [platformReviewers, setPlatformReviewers] = useState(review.platformReviewers);
  const [metadata, setMetadata] = useState(review.metadata);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const { data: components = [] } = useListComponentsQuery();
  const { refetch, isFetching: isReloading } = useGetReviewQuery(review.id);
  const [updateReview, { error: saveError, reset: resetSave }] = useUpdateReviewMutation({
    fixedCacheKey: detailsSaveKey(review.id),
  });
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await updateReview({
        id: review.id,
        body: { component, raisedBy, context, internalReviewers, platformReviewers, metadata, version: review.version },
      }).unwrap();
      notify("success", "Changes saved.");
      onClose();
    } catch (error) {
      notify("error", isConflict(error) ? "Someone else changed this PR. Reload to continue." : "Changes weren't saved.");
    }
  }

  async function handleReloadLatest() {
    await refetch();
    resetSave();
  }

  async function handleDelete() {
    try {
      await deleteReview(review.id).unwrap();
      notify("success", `Stopped tracking ${prLabel(review.prUrl)}.`);
      onClose();
    } catch {
      setConfirmingDelete(false);
      notify("error", "Couldn't stop tracking this PR. Please try again.");
    }
  }

  const hasFieldErrors = fieldError(saveError, "component") || fieldError(saveError, "raisedBy");

  return (
    <>
      <form id={DETAILS_FORM_ID} onSubmit={handleSave} className={styles.section} aria-labelledby="details-heading">
        <h3 id="details-heading" className={styles.sectionTitle}>
          Details
        </h3>

        {isConflict(saveError) ? (
          <div role="alert" className={styles.errorBanner}>
            <span>This PR was changed by someone else since you opened it. Your edits are kept.</span>
            <Button type="button" variant="secondary" onClick={handleReloadLatest} loading={isReloading}>
              <RefreshCw size={14} aria-hidden="true" />
              Load latest version
            </Button>
          </div>
        ) : (
          saveError &&
          !hasFieldErrors && (
            <p role="alert" className={styles.errorBanner}>
              {problemDetail(saveError)}
            </p>
          )
        )}

        <div className={styles.twoCol}>
          <TextField
            label="Component"
            required
            list="component-suggestions"
            value={component}
            onChange={(e) => setComponent(e.target.value)}
            error={fieldError(saveError, "component")}
          />
          <TextField
            label="Raised by"
            required
            value={raisedBy}
            onChange={(e) => setRaisedBy(e.target.value)}
            error={fieldError(saveError, "raisedBy")}
          />
        </div>
        <datalist id="component-suggestions">
          {components.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <TextArea
          label="Context"
          hint="What reviewers should know before they start."
          value={context}
          onChange={(e) => setContext(e.target.value)}
          error={fieldError(saveError, "context")}
        />
        <TagInput label="Internal reviewers" values={internalReviewers} onChange={setInternalReviewers} />
        <TagInput label="Platform reviewers" values={platformReviewers} onChange={setPlatformReviewers} />
        <KeyValueEditor label="Metadata" values={metadata} onChange={setMetadata} />

        <a className={styles.githubLink} href={review.prUrl} target="_blank" rel="noreferrer">
          View on GitHub
          <ExternalLink size={13} aria-hidden="true" />
          <span className="visually-hidden">(opens in a new tab)</span>
        </a>
      </form>

      <section className={styles.dangerZone} aria-labelledby="danger-heading">
        <div>
          <h3 id="danger-heading" className={styles.sectionTitle}>
            Stop tracking
          </h3>
          <p className={styles.dangerText}>Removes this PR and its review history from the dashboard.</p>
        </div>
        <Button type="button" variant="danger" onClick={() => setConfirmingDelete(true)}>
          Stop tracking
        </Button>
      </section>

      {confirmingDelete && (
        <ConfirmDialog
          title="Stop tracking this PR?"
          confirmLabel="Stop tracking"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
          loading={isDeleting}
        >
          {prLabel(review.prUrl)} and its review history will be removed. This can&apos;t be undone.
        </ConfirmDialog>
      )}
    </>
  );
}
