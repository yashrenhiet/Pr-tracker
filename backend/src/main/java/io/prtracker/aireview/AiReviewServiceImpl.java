package io.prtracker.aireview;

import io.prtracker.aireview.AiReviewResult.AiReviewComment;
import io.prtracker.aireview.AiReviewResultValidator.Validated;
import io.prtracker.common.NotFoundException;
import io.prtracker.review.PrReview;
import io.prtracker.review.PrReviewRepository;
import io.prtracker.review.PrStatus;
import io.prtracker.review.PrUrl;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

/**
 * Runs the AI review pipeline for one PR: fetch diff → prompt the model → validate its reply →
 * post to GitHub → record the outcome, and reflect that outcome onto the tracked PR's own status.
 *
 * <p><b>Not wrapped in one {@code @Transactional}</b>: the GitHub and LLM calls are slow network I/O
 * (seconds to over a minute), and holding a single DB transaction open for that long would tie up a
 * pool connection the whole time. Each repository call below is its own short, independently
 * committed write via {@code saveAndFlush} — the same reasoning applies here as to why {@code
 * ReviewService.create} flushes immediately, just extended across a longer pipeline.
 *
 * <p><b>Per-PR failure isolation</b>: every external call is caught individually and turned into a
 * FAILED run with a human-readable reason, never an exception that escapes to the caller. The
 * scheduler depends on this — one broken PR must not stop the rest of a batch.
 */
@Service
public class AiReviewServiceImpl implements AiReviewService {

  private static final Logger log = LoggerFactory.getLogger(AiReviewServiceImpl.class);

  /**
   * Statuses a human hasn't already moved past. An AI review completing after a PR was merged,
   * closed, or approved by a human must not silently drag its status backwards.
   */
  private static final Set<PrStatus> AUTO_TRANSITIONABLE =
      Set.of(PrStatus.READY_FOR_REVIEW, PrStatus.REVIEW_IN_PROGRESS, PrStatus.COMMENTS_ADDRESSED);

  private final PrReviewRepository reviewRepository;
  private final AiReviewRunRepository runRepository;
  private final AiReviewProperties properties;
  private final AiReviewClientFactory clientFactory;
  private final GitHubReviewClient gitHubClient;

  AiReviewServiceImpl(
      PrReviewRepository reviewRepository,
      AiReviewRunRepository runRepository,
      AiReviewProperties properties,
      AiReviewClientFactory clientFactory,
      GitHubReviewClient gitHubClient) {
    this.reviewRepository = reviewRepository;
    this.runRepository = runRepository;
    this.properties = properties;
    this.clientFactory = clientFactory;
    this.gitHubClient = gitHubClient;
  }

  @Override
  public AiReviewDtos.AiReviewRunResponse triggerNow(long reviewId) {
    PrReview review =
        reviewRepository.findById(reviewId).orElseThrow(() -> new NotFoundException("Review", reviewId));
    requireConfigured();

    reapStaleRun(reviewId);

    AiReviewRun run = new AiReviewRun(reviewId, properties.providerName(), properties.resolvedModel(), properties.dryRun());
    try {
      run = runRepository.saveAndFlush(run);
    } catch (DataIntegrityViolationException e) {
      throw new AiReviewAlreadyRunningException(reviewId);
    }

    executeRun(review, run);
    return AiReviewDtos.AiReviewRunResponse.from(runRepository.findById(run.getId()).orElseThrow());
  }

  @Override
  public java.util.Optional<AiReviewDtos.AiReviewRunResponse> latest(long reviewId) {
    return runRepository.findFirstByPrReviewIdOrderByStartedAtDesc(reviewId).map(AiReviewDtos.AiReviewRunResponse::from);
  }

  @Override
  public List<AiReviewDtos.AiReviewRunResponse> history(long reviewId) {
    return runRepository.findByPrReviewIdOrderByStartedAtDesc(reviewId).stream()
        .map(AiReviewDtos.AiReviewRunResponse::from)
        .toList();
  }

  private void requireConfigured() {
    if (!properties.enabled()) {
      throw new AiReviewNotConfiguredException("AI review is disabled. Set AI_REVIEW_ENABLED=true to turn it on.");
    }
    if (properties.apiKey() == null || properties.apiKey().isBlank()) {
      throw new AiReviewNotConfiguredException(
          "AI_REVIEW_API_KEY is not set for provider " + properties.providerName() + ".");
    }
    if (!properties.githubConfigured()) {
      throw new AiReviewNotConfiguredException(
          "AI_REVIEW_GITHUB_TOKEN is not set — required to read the PR diff, even in dry-run mode.");
    }
  }

  /**
   * Self-heals a RUNNING row that never reached a terminal state (the process was killed mid-run).
   * Without this, the unique "one RUNNING row per PR" index would permanently block that PR.
   * "Stale" is twice the configured timeout — generous enough that a genuinely slow in-flight call
   * is never mistaken for an orphan.
   */
  private void reapStaleRun(long reviewId) {
    Instant staleBefore = Instant.now().minusSeconds(properties.timeoutSeconds() * 2L);
    runRepository
        .findStaleRunning(reviewId, staleBefore)
        .ifPresent(
            stale -> {
              log.warn("[AiReview] Reaping stale RUNNING run id={} for review={}", stale.getId(), reviewId);
              stale.markFailed("Run did not complete in time and was reset by a later trigger.");
              runRepository.saveAndFlush(stale);
            });
  }

  private void executeRun(PrReview review, AiReviewRun run) {
    PrUrl url;
    try {
      url = PrUrl.parse(review.getPrUrl());
    } catch (Exception e) {
      failRun(run, "Could not parse the tracked PR URL: " + e.getMessage());
      return;
    }

    String diff;
    try {
      diff = gitHubClient.fetchDiff(url.host(), url.owner(), url.repo(), url.number());
    } catch (Exception e) {
      failRun(run, "Could not fetch the diff from GitHub: " + rootMessage(e));
      return;
    }

    String truncatedDiff = AiDiffUtils.truncate(diff, properties.maxDiffChars());
    Map<String, Set<Integer>> commentableLines = AiDiffUtils.parseCommentableLines(truncatedDiff);

    String reply;
    try {
      reply = clientFactory.create().chat(ReviewPromptBuilder.systemPrompt(), ReviewPromptBuilder.userPrompt(review, truncatedDiff));
    } catch (Exception e) {
      failRun(run, "The AI provider call failed: " + rootMessage(e));
      return;
    }

    Validated validated;
    try {
      validated = AiReviewResultValidator.validate(AiReviewJson.parse(reply), commentableLines);
    } catch (Exception e) {
      failRun(run, "Could not understand the model's reply: " + rootMessage(e));
      return;
    }
    validated.rejections().forEach(reason -> log.warn("[AiReview] run={} {}", run.getId(), reason));

    boolean posted = false;
    if (!properties.dryRun()) {
      try {
        postToGitHub(url, validated);
        posted = true;
      } catch (Exception e) {
        failRun(run, "Review was generated but could not be posted to GitHub: " + rootMessage(e));
        return;
      }
    }

    run.markSucceeded(validated.verdict(), validated.summary(), validated.comments().size(), validated.rejections().size());
    runRepository.saveAndFlush(run);

    if (posted) {
      transitionAfterSuccess(review, validated.comments().size());
    }
    // Dry run: the tracked PR's status is left untouched — nothing was actually posted for a human
    // (or the scheduler) to act on yet.
  }

  private void postToGitHub(PrUrl url, Validated validated) {
    List<AiReviewComment> comments = validated.comments();
    gitHubClient.submitReview(url.host(), url.owner(), url.repo(), url.number(), validated.verdict(), validated.summary(), comments);
  }

  private void transitionAfterSuccess(PrReview review, int commentsPosted) {
    if (!AUTO_TRANSITIONABLE.contains(review.getStatus())) {
      return;
    }
    PrStatus next = commentsPosted > 0 ? PrStatus.BOT_REVIEW_COMPLETED : PrStatus.READY_FOR_PLATFORM_REVIEW;
    review.changeStatus(next, null);
    reviewRepository.saveAndFlush(review);
  }

  private void failRun(AiReviewRun run, String error) {
    log.error("[AiReview] run={} failed: {}", run.getId(), error);
    run.markFailed(error);
    runRepository.saveAndFlush(run);
    reviewRepository
        .findById(run.getPrReviewId())
        .filter(review -> AUTO_TRANSITIONABLE.contains(review.getStatus()))
        .ifPresent(
            review -> {
              review.changeStatus(PrStatus.BOT_REVIEW_REJECTED, null);
              reviewRepository.saveAndFlush(review);
            });
  }

  /** The deepest cause's message, or the exception's own — network exceptions often wrap the useful text one level down. */
  private static String rootMessage(Throwable t) {
    Throwable cause = t;
    while (cause.getCause() != null && cause.getCause() != cause) {
      cause = cause.getCause();
    }
    return cause.getMessage() != null ? cause.getMessage() : cause.getClass().getSimpleName();
  }
}
