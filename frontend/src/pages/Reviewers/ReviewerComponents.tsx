import { useState } from "react";
import { X } from "lucide-react";
import { useGrantComponentMutation, useListComponentsQuery, useRevokeComponentMutation } from "../../store/api";
import type { ReviewerResponse } from "../../types";
import { Button, useToast } from "../../components/ui";
import styles from "./styles.module.css";

export interface ReviewerComponentsProps {
  reviewer: ReviewerResponse;
}

/** The chip list of granted components plus the small "grant another" form, for one reviewer card. */
export function ReviewerComponents({ reviewer }: ReviewerComponentsProps) {
  const [draft, setDraft] = useState("");
  const { data: allComponents = [] } = useListComponentsQuery();
  const [grant, { isLoading: isGranting }] = useGrantComponentMutation();
  const [revoke] = useRevokeComponentMutation();
  const { notify } = useToast();

  async function handleGrant(event: React.FormEvent) {
    event.preventDefault();
    const component = draft.trim();
    if (!component) {
      return;
    }
    try {
      await grant({ id: reviewer.id, component }).unwrap();
      setDraft("");
    } catch {
      notify("error", `Couldn't grant "${component}" to ${reviewer.name}.`);
    }
  }

  async function handleRevoke(component: string) {
    try {
      await revoke({ id: reviewer.id, component }).unwrap();
    } catch {
      notify("error", `Couldn't revoke "${component}" from ${reviewer.name}.`);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
      <span className={styles.componentsLabel}>Components</span>
      {reviewer.components.length > 0 ? (
        <ul className={styles.chips}>
          {reviewer.components.map((component) => (
            <li key={component} className={styles.chip}>
              {component}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => handleRevoke(component)}
                aria-label={`Revoke ${component} from ${reviewer.name}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noComponents}>Not assigned to any components yet.</p>
      )}
      <form className={styles.grantForm} onSubmit={handleGrant}>
        <label className="visually-hidden" htmlFor={`grant-${reviewer.id}`}>
          Grant a component to {reviewer.name}
        </label>
        <input
          id={`grant-${reviewer.id}`}
          className={styles.grantInput}
          list={`components-${reviewer.id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a component"
        />
        <datalist id={`components-${reviewer.id}`}>
          {allComponents.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Button type="submit" variant="secondary" loading={isGranting} disabled={!draft.trim()}>
          Add
        </Button>
      </form>
    </div>
  );
}
