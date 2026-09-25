import { useId, type TextareaHTMLAttributes } from "react";
import shared from "../shared/formField.module.css";
import { FieldMessage } from "../shared/FieldMessage";
import { describedBy } from "../shared/describedBy";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextArea({ label, error, hint, id, required, className, rows = 4, ...rest }: TextAreaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={shared.field}>
      <label htmlFor={fieldId} className={shared.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        className={[shared.control, error && shared.invalid, className].filter(Boolean).join(" ")}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      />
      <FieldMessage fieldId={fieldId} error={error} hint={hint} />
    </div>
  );
}
