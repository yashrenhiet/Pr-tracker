import { useId, type SelectHTMLAttributes } from "react";
import shared from "../shared/formField.module.css";
import { FieldMessage } from "../shared/FieldMessage";
import { describedBy } from "../shared/describedBy";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
}

export function Select({
  label,
  options,
  error,
  hint,
  placeholder,
  id,
  required,
  className,
  ...rest
}: SelectProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <div className={shared.field}>
      <label htmlFor={fieldId} className={shared.label}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <select
        id={fieldId}
        className={[shared.control, error && shared.invalid, className].filter(Boolean).join(" ")}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldMessage fieldId={fieldId} error={error} hint={hint} />
    </div>
  );
}
