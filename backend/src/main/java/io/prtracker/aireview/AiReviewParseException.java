package io.prtracker.aireview;

/**
 * Thrown when the model's reply cannot be understood as the JSON contract in {@link
 * ReviewPromptBuilder}. Always caught inside {@code AiReviewServiceImpl} and turned into a FAILED
 * run — an LLM occasionally ignoring its instructions is an expected outcome, not a server error.
 */
public class AiReviewParseException extends RuntimeException {

  public AiReviewParseException(String message) {
    super(message);
  }
}
