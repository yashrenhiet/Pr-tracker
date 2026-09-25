import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import styles from "./styles.module.css";

export interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/**
 * Chip list for the reviewer arrays (`internalReviewers`, `platformReviewers`). Type a name and
 * press Enter or comma to add it; duplicates (case-insensitive) are ignored, matching the
 * backend's `Normalize.names`.
 */
export function TagInput({ label, values, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const fieldId = useId();

  function addTag(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      return;
    }
    const exists = values.some((v) => v.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      onChange([...values, trimmed]);
    }
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    } else if (event.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  function removeTag(name: string) {
    onChange(values.filter((v) => v !== name));
  }

  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
      </label>
      {values.length > 0 && (
        <ul className={styles.chips}>
          {values.map((name) => (
            <li key={name} className={styles.chip}>
              {name}
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeTag(name)}
                aria-label={`Remove ${name}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={fieldId}
        type="text"
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addTag(draft)}
        placeholder={placeholder}
        aria-describedby={`${fieldId}-hint`}
      />
      <p id={`${fieldId}-hint`} className={styles.hint}>
        Press Enter or comma to add
      </p>
    </div>
  );
}
