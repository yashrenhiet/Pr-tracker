import { useState } from "react";
import { useCreateReviewMutation, useListComponentsQuery } from "../../store/api";
import { fieldError, problemDetail } from "../../api/problemDetail";
import { Button, Drawer, KeyValueEditor, TagInput, TextArea, TextField, useToast } from "../../components/ui";
import { prLabel } from "../../utils/prUrl";
import styles from "./ReviewDetail.module.css";

const FORM_ID = "add-review-form";
const FIELDS_WITH_INLINE_ERRORS = ["prUrl", "component", "raisedBy", "context"];

export interface AddReviewPanelProps {
  onClose: () => void;
  /** Receives the new review's id, so the caller can open it straight away. */
  onCreated: (id: number) => void;
}

export function AddReviewPanel({ onClose, onCreated }: AddReviewPanelProps) {
  const { notify } = useToast();
  const [prUrl, setPrUrl] = useState("");
  const [component, setComponent] = useState("");
  const [raisedBy, setRaisedBy] = useState("");
  const [context, setContext] = useState("");
  const [internalReviewers, setInternalReviewers] = useState<string[]>([]);
  const [platformReviewers, setPlatformReviewers] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const { data: components = [] } = useListComponentsQuery();
  const [createReview, { isLoading, error }] = useCreateReviewMutation();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const created = await createReview({
        prUrl: prUrl.trim(),
        component: component.trim(),
        raisedBy: raisedBy.trim(),
        context: context.trim() || undefined,
        internalReviewers,
        platformReviewers,
        metadata,
      }).unwrap();
      notify("success", `Now tracking ${prLabel(created.prUrl)}.`);
      onCreated(created.id);
    } catch {
      notify("error", "The PR wasn't added. Check the highlighted fields.");
    }
  }

  const generalError =
    error && FIELDS_WITH_INLINE_ERRORS.every((f) => !fieldError(error, f)) ? problemDetail(error) : undefined;

  const footer = (
    <>
      <span />
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID} variant="primary" loading={isLoading}>
          Track PR
        </Button>
      </div>
    </>
  );

  return (
    <Drawer title="Track a pull request" subtitle="Follow a PR's review from open to merge." onClose={onClose} footer={footer}>
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className={styles.section}>
          {generalError && (
            <p role="alert" className={styles.errorBanner}>
              {generalError}
            </p>
          )}
          <TextField
            label="Pull request URL"
            required
            type="url"
            inputMode="url"
            autoComplete="off"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="https://github.com/org/repo/pull/123"
            error={fieldError(error, "prUrl")}
          />
          <div className={styles.twoCol}>
            <TextField
              label="Component"
              required
              list="component-suggestions"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              hint="Pick one or type a new name"
              error={fieldError(error, "component")}
            />
            <TextField
              label="Raised by"
              required
              value={raisedBy}
              onChange={(e) => setRaisedBy(e.target.value)}
              error={fieldError(error, "raisedBy")}
            />
          </div>
          <datalist id="component-suggestions">
            {components.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Reviewers</h3>
          <TagInput label="Internal reviewers" values={internalReviewers} onChange={setInternalReviewers} />
          <TagInput label="Platform reviewers" values={platformReviewers} onChange={setPlatformReviewers} />
        </div>

        <div className={styles.section} style={{ borderBottom: "none", marginBottom: 0 }}>
          <h3 className={styles.sectionTitle}>Optional</h3>
          <TextArea
            label="Context"
            hint="What reviewers should know before they start."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            error={fieldError(error, "context")}
          />
          <KeyValueEditor label="Metadata" values={metadata} onChange={setMetadata} />
        </div>
      </form>
    </Drawer>
  );
}
