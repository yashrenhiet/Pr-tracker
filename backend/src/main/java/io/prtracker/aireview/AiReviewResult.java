package io.prtracker.aireview;

import java.util.List;

/**
 * The exact JSON shape the model is instructed to return — see {@link ReviewPromptBuilder}. Field
 * names match the prompt contract; {@code severity}/{@code verdict} are kept as raw strings here
 * because the model's spelling is validated (and normalised or rejected) by {@link
 * AiReviewResultValidator}, not trusted at parse time.
 */
public record AiReviewResult(String summary, String verdict, List<AiReviewComment> comments) {

  public record AiReviewComment(String path, int line, String severity, String message) {}
}
