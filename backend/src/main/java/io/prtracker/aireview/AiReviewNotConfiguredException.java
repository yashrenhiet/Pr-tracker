package io.prtracker.aireview;

/** Thrown when the AI review feature is used without the configuration it needs. Maps to HTTP 503. */
public class AiReviewNotConfiguredException extends RuntimeException {

  public AiReviewNotConfiguredException(String message) {
    super(message);
  }
}
