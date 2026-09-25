import { useId, type InputHTMLAttributes } from "react";
import shared from "../shared/formField.module.css";
import { FieldMessage } from "../shared/FieldMessage";
import { describedBy } from "../shared/describedBy";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function TextField({ label, error, hint, id, required, className, ...rest }: TextFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={shared.field}>
      <label htmlFor={fieldId} className={shared.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={fieldId}
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
