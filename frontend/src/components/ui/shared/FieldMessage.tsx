import shared from "./formField.module.css";

export interface FieldMessageProps {
  fieldId: string;
  error?: string;
  hint?: string;
}

/** The hint-or-error line under a label+control pair. Shared by TextField, TextArea and Select. */
export function FieldMessage({ fieldId, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <p id={`${fieldId}-error`} role="alert" className={shared.error}>
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${fieldId}-hint`} className={shared.hint}>
        {hint}
      </p>
    );
  }
  return null;
}
