import { useState } from "react";
import { useCreateReviewerMutation } from "../../store/api";
import { fieldError, problemDetail } from "../../api/problemDetail";
import { Button, Drawer, TextField } from "../../components/ui";

export interface AddReviewerPanelProps {
  onClose: () => void;
}

export function AddReviewerPanel({ onClose }: AddReviewerPanelProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [createReviewer, { isLoading, error }] = useCreateReviewerMutation();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createReviewer({ name, email, handle }).unwrap();
      onClose();
    } catch {
      // Surfaced via `error` below.
    }
  }

  const generalError =
    error && !fieldError(error, "name") && !fieldError(error, "email") && !fieldError(error, "handle")
      ? problemDetail(error)
      : undefined;

  return (
    <Drawer title="Add reviewer" onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {generalError && (
          <p role="alert" style={{ color: "var(--color-danger)", fontSize: 13 }}>
            {generalError}
          </p>
        )}

        <TextField label="Name" required value={name} onChange={(e) => setName(e.target.value)} error={fieldError(error, "name")} />
        <TextField
          label="Email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError(error, "email")}
        />
        <TextField
          label="Handle"
          required
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          hint="Letters, digits and '-', starting with a letter or digit"
          error={fieldError(error, "handle")}
        />

        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Add reviewer
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
