package io.prtracker.aireview;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** {@code GET /api/ai-review/config}: whether the AI review feature is usable, with no secrets. */
@RestController
@RequestMapping("/api/ai-review/config")
public class AiReviewConfigController {

  private final AiReviewProperties properties;

  AiReviewConfigController(AiReviewProperties properties) {
    this.properties = properties;
  }

  @GetMapping
  public AiReviewDtos.AiReviewConfigResponse get() {
    return new AiReviewDtos.AiReviewConfigResponse(
        properties.enabled(), properties.providerName(), properties.resolvedModel(), properties.dryRun(), properties.githubConfigured());
  }
}
