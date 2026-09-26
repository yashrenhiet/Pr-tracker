package io.prtracker.aireview;

/** Thrown when a run is already RUNNING for a PR and a second one is requested. Maps to HTTP 409. */
public class AiReviewAlreadyRunningException extends RuntimeException {

  public AiReviewAlreadyRunningException(long reviewId) {
    super("An AI review is already running for review " + reviewId);
  }
}
