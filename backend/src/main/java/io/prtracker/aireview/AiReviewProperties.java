package io.prtracker.aireview;

import java.util.Locale;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings for the AI code review engine, bound from {@code ai.review.*} (see {@code
 * application.yml} for the env vars behind each one). All defaults live in {@code application.yml}
 * — this record has none of its own, so there is exactly one place to look for what a fresh
 * install does out of the box.
 *
 * <p>{@code enabled} defaults to {@code false} and {@code dryRun} defaults to {@code true}: a
 * project that hasn't configured this feature gets no scheduled network calls, and a project that
 * has just added an API key gets to see what the bot would post before it posts anything.
 */
@ConfigurationProperties(prefix = "ai.review")
public record AiReviewProperties(
    boolean enabled,
    Provider provider,
    String apiKey,
    String model,
    String baseUrl,
    String githubToken,
    boolean dryRun,
    int timeoutSeconds,
    int maxDiffChars,
    boolean schedulerEnabled,
    String schedulerCron,
    int schedulerBatchSize) {

  public enum Provider {
    OPENAI,
    ANTHROPIC
  }

  /** The model to call: whatever is configured, or a sensible current default per provider. */
  public String resolvedModel() {
    if (model != null && !model.isBlank()) {
      return model;
    }
    return provider == Provider.ANTHROPIC ? "claude-sonnet-4-5-20250929" : "gpt-4o-mini";
  }

  public boolean githubConfigured() {
    return githubToken != null && !githubToken.isBlank();
  }

  public String providerName() {
    return provider.name().toLowerCase(Locale.ROOT);
  }
}
