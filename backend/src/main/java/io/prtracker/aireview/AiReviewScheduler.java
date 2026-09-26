package io.prtracker.aireview;

import io.prtracker.review.PrReview;
import io.prtracker.review.PrReviewRepository;
import io.prtracker.review.PrStatus;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Periodically dispatches {@link AiReviewService#triggerNow} for PRs waiting on a bot review, so
 * tracking a PR is enough to get it reviewed — nobody has to click a button.
 *
 * <p>Off by default ({@code ai.review.scheduler-enabled=false}); the {@code ai.review.enabled}
 * check inside {@code triggerNow} is a second, independent guard, so disabling the whole feature
 * also stops a scheduler someone forgot to turn off.
 *
 * <p><b>Concurrency:</b> this app doesn't assume multiple instances, so there's no distributed lock
 * here (contrast a ShedLock-style guard, which would be the right addition if you do run more than
 * one instance). The correctness property that matters — never reviewing the same PR twice at once
 * — is enforced at the database level by the unique "one RUNNING row per PR" index in
 * V2__ai_review.sql, which holds regardless of how many instances are ticking.
 */
@Component
class AiReviewScheduler {

  private static final Logger log = LoggerFactory.getLogger(AiReviewScheduler.class);

  /** PRs a bot review is meaningful for: newly tracked, or explicitly re-requested after fixes. */
  private static final List<PrStatus> DUE_STATUSES = List.of(PrStatus.READY_FOR_REVIEW, PrStatus.COMMENTS_ADDRESSED);

  private final AiReviewProperties properties;
  private final PrReviewRepository reviewRepository;
  private final AiReviewService aiReviewService;

  AiReviewScheduler(AiReviewProperties properties, PrReviewRepository reviewRepository, AiReviewService aiReviewService) {
    this.properties = properties;
    this.reviewRepository = reviewRepository;
    this.aiReviewService = aiReviewService;
  }

  @Scheduled(cron = "${ai.review.scheduler-cron:0 */10 * * * *}")
  void tick() {
    if (!properties.enabled() || !properties.schedulerEnabled()) {
      return;
    }

    var pageable = PageRequest.of(0, properties.schedulerBatchSize(), Sort.by(Sort.Direction.ASC, "updatedAt"));
    List<PrReview> due = reviewRepository.findByStatusIn(DUE_STATUSES, pageable).getContent();
    if (due.isEmpty()) {
      return;
    }
    log.info("[AiReviewScheduler] Found {} PR(s) due for AI review", due.size());

    for (PrReview review : due) {
      dispatchOne(review);
    }
  }

  private void dispatchOne(PrReview review) {
    try {
      aiReviewService.triggerNow(review.getId());
    } catch (AiReviewAlreadyRunningException e) {
      log.debug("[AiReviewScheduler] review={} already running — skipping", review.getId());
    } catch (Exception e) {
      // One broken PR (bad token, provider outage, malformed diff) must not stop the batch.
      log.error("[AiReviewScheduler] review={} failed to dispatch — skipping, batch continues", review.getId(), e);
    }
  }
}
