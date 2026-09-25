import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useDeleteReviewerMutation, useListReviewersQuery } from "../../store/api";
import { Button, Spinner } from "../../components/ui";
import { AddReviewerPanel } from "./AddReviewerPanel";
import { ReviewerComponents } from "./ReviewerComponents";
import styles from "./styles.module.css";

export function ReviewersPage() {
  const [isAdding, setIsAdding] = useState(false);
  const { data: reviewers, isLoading } = useListReviewersQuery();
  const [deleteReviewer] = useDeleteReviewerMutation();

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Remove ${name} as a reviewer? Their component grants go with them.`)) {
      return;
    }
    await deleteReviewer(id).unwrap();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h1>Reviewers</h1>
        <Button type="button" variant="primary" onClick={() => setIsAdding(true)}>
          <Plus size={16} aria-hidden="true" />
          Add reviewer
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <Spinner label="Loading reviewers" />
        </div>
      ) : !reviewers || reviewers.length === 0 ? (
        <div className={styles.emptyState}>No reviewers yet.</div>
      ) : (
        <table className={styles.table}>
          <caption className="visually-hidden">Reviewers and their granted components</caption>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Handle</th>
              <th scope="col">Components</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {reviewers.map((reviewer) => (
              <tr key={reviewer.id}>
                <td>{reviewer.name}</td>
                <td>{reviewer.email}</td>
                <td>{reviewer.handle}</td>
                <td>
                  <ReviewerComponents reviewer={reviewer} />
                </td>
                <td>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleDelete(reviewer.id, reviewer.name)}
                    aria-label={`Remove ${reviewer.name}`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isAdding && <AddReviewerPanel onClose={() => setIsAdding(false)} />}
    </div>
  );
}
