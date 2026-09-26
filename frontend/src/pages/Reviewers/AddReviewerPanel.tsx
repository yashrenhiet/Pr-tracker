import { useState } from "react";
import { useCreateReviewerMutation } from "../../store/api";
import { fieldError, problemDetail } from "../../api/problemDetail";
import { Button, Drawer, TextField, useToast } from "../../components/ui";
import detailStyles from "../Dashboard/ReviewDetail.module.css";

const FORM_ID = "add-reviewer-form";

export interface AddReviewerPanelProps {
  onClose: () => void;
}

export function AddReviewerPanel({ onClose }: AddReviewerPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [createReviewer, { isLoading, error }] = useCreateReviewerMutation();
  const { notify } = useToast();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const created = await createReviewer({ name: name.trim(), email: email.trim(), handle: handle.trim() }).unwrap();
      notify("success", `${created.name} was added. Assign them components on their card.`);
      onClose();
    } catch {
      notify("error", "The reviewer wasn't added. Check the highlighted fields.");
    }
  }

  const generalError =
    error && !fieldError(error, "name") && !fieldError(error, "email") && !fieldError(error, "handle")
      ? problemDetail(error)
      : undefined;

  const footer = (
    <>
      <span />
      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={FORM_ID} variant="primary" loading={isLoading}>
          Add reviewer
        </Button>
      </div>
    </>
  );

  return (
    <Drawer title="Add a reviewer" subtitle="You can assign components once they're added." onClose={onClose} footer={footer}>
      <form id={FORM_ID} onSubmit={handleSubmit} className={detailStyles.section} style={{ borderBottom: "none" }}>
        {generalError && (
          <p role="alert" className={detailStyles.errorBanner}>
            {generalError}
          </p>
        )}
        <TextField
          label="Full name"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldError(error, "name")}
        />
        <TextField
          label="Work email"
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError(error, "email")}
        />
        <TextField
          label="GitHub handle"
          required
          autoComplete="off"
          spellCheck={false}
          value={handle}
          onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
          hint="Letters, digits and hyphens, e.g. jane-doe"
          error={fieldError(error, "handle")}
        />
      </form>
    </Drawer>
  );
}
