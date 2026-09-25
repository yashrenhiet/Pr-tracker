import { useState } from "react";
import { X } from "lucide-react";
import { useGrantComponentMutation, useListComponentsQuery, useRevokeComponentMutation } from "../../store/api";
import type { ReviewerResponse } from "../../types";
import { Button } from "../../components/ui";
import styles from "./styles.module.css";

export interface ReviewerComponentsProps {
  reviewer: ReviewerResponse;
}

/** The chip list of granted components plus the small "grant another" form, for one reviewer row. */
export function ReviewerComponents({ reviewer }: ReviewerComponentsProps) {
  const [draft, setDraft] = useState("");
  const { data: allComponents = [] } = useListComponentsQuery();
  const [grant, { isLoading: isGranting }] = useGrantComponentMutation();
  const [revoke] = useRevokeComponentMutation();

  async function handleGrant(event: React.FormEvent) {
    event.preventDefault();
    const component = draft.trim();
    if (!component) {
      return;
    }
    await grant({ id: reviewer.id, component }).unwrap();
    setDraft("");
  }

  return (
    <div>
      {reviewer.components.length > 0 && (
        <ul className={styles.chips}>
          {reviewer.components.map((component) => (
            <li key={component} className={styles.chip}>
              {component}
              <button
                type="button"
                className={styles.chipRemove}
                onClick={() => revoke({ id: reviewer.id, component })}
                aria-label={`Revoke ${component} from ${reviewer.name}`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
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
          placeholder="Component"
        />
        <datalist id={`components-${reviewer.id}`}>
          {allComponents.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Button type="submit" variant="ghost" loading={isGranting}>
          Grant
        </Button>
      </form>
    </div>
  );
}
