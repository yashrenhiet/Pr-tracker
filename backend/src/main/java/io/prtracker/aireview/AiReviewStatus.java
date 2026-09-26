package io.prtracker.aireview;

/** Lifecycle of one {@link AiReviewRun}. Names must match the CHECK constraint in V2__ai_review.sql. */
public enum AiReviewStatus {
  RUNNING,
  SUCCEEDED,
  FAILED
}
