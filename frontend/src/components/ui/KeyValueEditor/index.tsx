import { useState } from "react";
import { X } from "lucide-react";
import styles from "./styles.module.css";
import { Button } from "../Button";

export interface KeyValueEditorProps {
  label: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}

/** Editor for the free-form `metadata` map (ticket IDs and similar). */
export function KeyValueEditor({ label, values, onChange }: KeyValueEditorProps) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const entries = Object.entries(values);

  function add() {
    const k = key.trim();
    const v = value.trim();
    if (!k || !v) {
      return;
    }
    onChange({ ...values, [k]: v });
    setKey("");
    setValue("");
  }

  function remove(k: string) {
    const next = { ...values };
    delete next[k];
    onChange(next);
  }

  return (
    <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
      <legend
        style={{
          fontSize: 13,
          fontWeight: 600,
          padding: 0,
          marginBottom: "var(--space-1)",
        }}
      >
        {label}
      </legend>

      {entries.length > 0 && (
        <ul className={styles.list}>
          {entries.map(([k, v]) => (
            <li key={k} className={styles.entry}>
              <span className={styles.key}>{k}</span>
              <span className={styles.value}>{v}</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => remove(k)}
                aria-label={`Remove ${k}`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.row}>
        <input
          className={styles.smallInput}
          aria-label="New metadata key"
          placeholder="Key, e.g. ticket"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <input
          className={styles.smallInput}
          aria-label="New metadata value"
          placeholder="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
    </fieldset>
  );
}
