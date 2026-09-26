package io.prtracker.aireview;

/**
 * Thrown when the AI provider or GitHub call itself fails (network, auth, rate limit, non-2xx).
 * Always caught inside {@code AiReviewServiceImpl} and turned into a FAILED run — it never reaches
 * a controller, so it has no HTTP mapping.
 */
public class AiReviewProviderException extends RuntimeException {

  public AiReviewProviderException(String message) {
    super(message);
  }

  public AiReviewProviderException(String message, Throwable cause) {
    super(message, cause);
  }
}
