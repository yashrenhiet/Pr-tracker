package io.prtracker.aireview;

import java.util.List;
import java.util.Optional;

public interface AiReviewService {

  /**
   * Runs the pipeline for this review synchronously and returns its outcome. Throws {@link
   * AiReviewNotConfiguredException} (503) if the feature isn't set up, or {@link
   * AiReviewAlreadyRunningException} (409) if a run is already in flight for this PR. Any failure
   * inside the pipeline itself (bad diff, provider error, unparseable reply) is captured in the
   * returned run rather than thrown.
   */
  AiReviewDtos.AiReviewRunResponse triggerNow(long reviewId);

  Optional<AiReviewDtos.AiReviewRunResponse> latest(long reviewId);

  List<AiReviewDtos.AiReviewRunResponse> history(long reviewId);
}
