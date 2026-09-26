package io.prtracker.aireview;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiReviewRunRepository extends JpaRepository<AiReviewRun, Long> {

  Optional<AiReviewRun> findFirstByPrReviewIdOrderByStartedAtDesc(Long prReviewId);

  List<AiReviewRun> findByPrReviewIdOrderByStartedAtDesc(Long prReviewId);

  /**
   * A RUNNING row for this PR that started before {@code before}. Used to self-heal a run that
   * never reached a terminal state (the process crashed mid-review) — without this, the unique
   * "one RUNNING row per PR" index in V2__ai_review.sql would block that PR from ever being
   * reviewed again.
   */
  @Query(
      "select r from AiReviewRun r where r.prReviewId = :prReviewId and r.status = "
          + "io.prtracker.aireview.AiReviewStatus.RUNNING and r.startedAt < :before")
  Optional<AiReviewRun> findStaleRunning(@Param("prReviewId") Long prReviewId, @Param("before") Instant before);
}
