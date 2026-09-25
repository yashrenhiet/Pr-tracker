import { useState } from "react";
import { useCreateReviewMutation, useListComponentsQuery } from "../../store/api";
import { fieldError, problemDetail } from "../../api/problemDetail";
import { Button, Drawer, KeyValueEditor, TagInput, TextArea, TextField, useToast } from "../../components/ui";

export interface AddReviewPanelProps {
  onClose: () => void;
  onCreated: () => void;
}

export function AddReviewPanel({ onClose, onCreated }: AddReviewPanelProps) {
  const [prUrl, setPrUrl] = useState("");
  const [component, setComponent] = useState("");
  const [raisedBy, setRaisedBy] = useState("");
  const [context, setContext] = useState("");
  const [internalReviewers, setInternalReviewers] = useState<string[]>([]);
  const [platformReviewers, setPlatformReviewers] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const { data: components = [] } = useListComponentsQuery();
  const [createReview, { isLoading, error }] = useCreateReviewMutation();
  const { notify } = useToast();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createReview({
        prUrl,
        component,
        raisedBy,
        context: context || undefined,
        internalReviewers,
        platformReviewers,
        metadata,
      }).unwrap();
      notify("success", "PR is now being tracked.");
      onCreated();
    } catch {
      notify("error", "Couldn't track that PR — see the error above.");
    }
  }

  return (
    <Drawer title="Track a new PR" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {error && !fieldError(error, "prUrl") && (
          <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
            {problemDetail(error)}
          </p>
        )}

        <TextField
          label="PR URL"
          required
          type="url"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
          placeholder="https://github.com/org/repo/pull/123"
          error={fieldError(error, "prUrl")}
        />

        <TextField
          label="Component"
          required
          list="component-suggestions"
          value={component}
          onChange={(e) => setComponent(e.target.value)}
          hint="Free text is fine — a new component is created on first use"
          error={fieldError(error, "component")}
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
          error={fieldError(error, "raisedBy")}
        />

        <TextArea
          label="Context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          error={fieldError(error, "context")}
        />

        <TagInput label="Internal reviewers" values={internalReviewers} onChange={setInternalReviewers} />
        <TagInput label="Platform reviewers" values={platformReviewers} onChange={setPlatformReviewers} />
        <KeyValueEditor label="Metadata" values={metadata} onChange={setMetadata} />

        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Track PR
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
