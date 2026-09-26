package io.prtracker.aireview;

import java.time.Instant;

/** Response shapes for the {@code /ai-review} API. */
public final class AiReviewDtos {

  private AiReviewDtos() {}

  public record AiReviewRunResponse(
      long id,
      long reviewId,
      String status,
      String verdict,
      String summary,
      int commentsPosted,
      int commentsRejected,
      String provider,
      String model,
      boolean dryRun,
      String error,
      Instant startedAt,
      Instant completedAt) {

    static AiReviewRunResponse from(AiReviewRun r) {
      return new AiReviewRunResponse(
          r.getId(),
          r.getPrReviewId(),
          r.getStatus().name(),
          r.getVerdict() == null ? null : r.getVerdict().name(),
          r.getSummary(),
          r.getCommentsPosted(),
          r.getCommentsRejected(),
          r.getProvider(),
          r.getModel(),
          r.isDryRun(),
          r.getError(),
          r.getStartedAt(),
          r.getCompletedAt());
    }
  }

  /**
   * What the frontend needs to decide whether to show the AI review UI at all — never the API key
   * or GitHub token themselves.
   */
  public record AiReviewConfigResponse(
      boolean enabled, String provider, String model, boolean dryRun, boolean githubConfigured) {}
}
