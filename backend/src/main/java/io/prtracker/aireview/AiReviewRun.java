package io.prtracker.aireview;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

/**
 * One attempt to review a PR with an LLM. Maps to {@code ai_review_run}.
 *
 * <p>Deliberately separate from {@link io.prtracker.review.PrReview}: a PR can be reviewed more
 * than once (a re-run after the author pushes fixes, a scheduled retry), and this row is the audit
 * trail of one such attempt, not shared mutable state on the PR itself. The tracked PR's own {@code
 * status} is updated as a side effect once a run finishes — see {@code AiReviewServiceImpl}.
 */
@Entity
@Table(name = "ai_review_run")
public class AiReviewRun {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "pr_review_id", nullable = false)
  private Long prReviewId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private AiReviewStatus status = AiReviewStatus.RUNNING;

  @Enumerated(EnumType.STRING)
  private AiReviewVerdict verdict;

  private String summary;

  @Column(name = "comments_posted", nullable = false)
  private int commentsPosted;

  @Column(name = "comments_rejected", nullable = false)
  private int commentsRejected;

  @Column(nullable = false)
  private String provider;

  @Column(nullable = false)
  private String model;

  @Column(name = "dry_run", nullable = false)
  private boolean dryRun;

  private String error;

  @CreationTimestamp
  @Column(name = "started_at", nullable = false, updatable = false)
  private Instant startedAt;

  @Column(name = "completed_at")
  private Instant completedAt;

  protected AiReviewRun() {}

  public AiReviewRun(Long prReviewId, String provider, String model, boolean dryRun) {
    this.prReviewId = prReviewId;
    this.provider = provider;
    this.model = model;
    this.dryRun = dryRun;
  }

  /** Records a completed pipeline, whether or not the comments were actually posted (see {@code dryRun}). */
  public void markSucceeded(AiReviewVerdict verdict, String summary, int commentsPosted, int commentsRejected) {
    this.status = AiReviewStatus.SUCCEEDED;
    this.verdict = verdict;
    this.summary = summary;
    this.commentsPosted = commentsPosted;
    this.commentsRejected = commentsRejected;
    this.completedAt = Instant.now();
  }

  /** Records why the pipeline stopped before producing a usable review. */
  public void markFailed(String error) {
    this.status = AiReviewStatus.FAILED;
    this.error = error;
    this.completedAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public Long getPrReviewId() {
    return prReviewId;
  }

  public AiReviewStatus getStatus() {
    return status;
  }

  public AiReviewVerdict getVerdict() {
    return verdict;
  }

  public String getSummary() {
    return summary;
  }

  public int getCommentsPosted() {
    return commentsPosted;
  }

  public int getCommentsRejected() {
    return commentsRejected;
  }

  public String getProvider() {
    return provider;
  }

  public String getModel() {
    return model;
  }

  public boolean isDryRun() {
    return dryRun;
  }

  public String getError() {
    return error;
  }

  public Instant getStartedAt() {
    return startedAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }
}
