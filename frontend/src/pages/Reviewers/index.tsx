import { useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { useDeleteReviewerMutation, useListReviewersQuery } from "../../store/api";
import { Button, Card, Spinner, useToast } from "../../components/ui";
import { AddReviewerPanel } from "./AddReviewerPanel";
import { ReviewerComponents } from "./ReviewerComponents";
import styles from "./styles.module.css";

export function ReviewersPage() {
  const [isAdding, setIsAdding] = useState(false);
  const { data: reviewers, isLoading } = useListReviewersQuery();
  const [deleteReviewer] = useDeleteReviewerMutation();
  const { notify } = useToast();

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Remove ${name} as a reviewer? Their component grants go with them.`)) {
      return;
    }
    try {
      await deleteReviewer(id).unwrap();
      notify("success", `Removed ${name}.`);
    } catch {
      notify("error", `Couldn't remove ${name}. Try again.`);
    }
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
        <Card className={styles.emptyState}>
          <Spinner label="Loading reviewers" />
        </Card>
      ) : !reviewers || reviewers.length === 0 ? (
        <Card className={styles.emptyState}>
          <Users size={32} aria-hidden="true" />
          <span>No reviewers yet. Add one and grant them the components they review.</span>
          <Button type="button" variant="primary" onClick={() => setIsAdding(true)}>
            Add reviewer
          </Button>
        </Card>
      ) : (
        <div className={styles.list}>
          {reviewers.map((reviewer) => (
            <Card key={reviewer.id} className={styles.reviewerCard}>
              <div className={styles.header}>
                <div className={styles.identity}>
                  <span className={styles.name}>{reviewer.name}</span>
                  <span className={styles.handle}>@{reviewer.handle}</span>
                  <span className={styles.email}>{reviewer.email}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleDelete(reviewer.id, reviewer.name)}
                  aria-label={`Remove ${reviewer.name}`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
              <span className={styles.componentsLabel}>Components</span>
              <ReviewerComponents reviewer={reviewer} />
            </Card>
          ))}
        </div>
      )}

      {isAdding && <AddReviewerPanel onClose={() => setIsAdding(false)} />}
    </div>
  );
}
