package io.prtracker.review;

/** Lifecycle of a tracked PR. Names must match the CHECK constraint in V1__init.sql. */
public enum PrStatus {
  READY_FOR_REVIEW("Ready for review"),
  REVIEW_IN_PROGRESS("Review in progress"),
  COMMENTS_ADDED("Comments added"),
  COMMENTS_ADDRESSED("Comments addressed"),
  APPROVED("Approved"),
  MERGED("Merged"),
  BLOCKED("Blocked"),
  BOT_REVIEW_COMPLETED("Bot review completed"),
  READY_FOR_PLATFORM_REVIEW("Ready for platform review"),
  BOT_REVIEW_REJECTED("Bot review rejected"),
  CLOSED("Closed");

  private final String label;

  PrStatus(String label) {
    this.label = label;
  }

  public String label() {
    return label;
  }
}
