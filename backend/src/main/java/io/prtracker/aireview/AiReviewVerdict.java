package io.prtracker.aireview;

/**
 * The model's overall recommendation for a run, deliberately using GitHub's own review-event
 * vocabulary so a verdict maps to a GitHub API call with no translation step.
 */
public enum AiReviewVerdict {
  APPROVE,
  REQUEST_CHANGES,
  COMMENT
}
