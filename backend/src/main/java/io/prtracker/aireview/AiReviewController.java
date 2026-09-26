package io.prtracker.aireview;

import io.prtracker.common.NotFoundException;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <pre>
 * POST /api/reviews/{id}/ai-review          run the AI review pipeline now, return its outcome
 * GET  /api/reviews/{id}/ai-review          the most recent run
 * GET  /api/reviews/{id}/ai-review/history  every run for this PR, newest first
 * </pre>
 */
@RestController
@RequestMapping("/api/reviews/{id}/ai-review")
public class AiReviewController {

  private final AiReviewService service;

  AiReviewController(AiReviewService service) {
    this.service = service;
  }

  @PostMapping
  public AiReviewDtos.AiReviewRunResponse trigger(@PathVariable long id) {
    return service.triggerNow(id);
  }

  @GetMapping
  public AiReviewDtos.AiReviewRunResponse latest(@PathVariable long id) {
    return service.latest(id).orElseThrow(() -> new NotFoundException("AI review run for review", id));
  }

  @GetMapping("/history")
  public List<AiReviewDtos.AiReviewRunResponse> history(@PathVariable long id) {
    return service.history(id);
  }
}
