package io.prtracker.aireview;

import java.time.Duration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/**
 * Builds the {@link AiReviewClient} for whichever provider is configured. A factory rather than two
 * conditional {@code @Bean}s: which provider is active depends on a single property value chosen at
 * call time, and callers never need to know or care which concrete implementation they got.
 */
@Component
class AiReviewClientFactory {

  /** Separate from the per-request read timeout: connecting is expected to be fast regardless of model size. */
  private static final Duration CONNECT_TIMEOUT = Duration.ofSeconds(10);

  private final AiReviewProperties properties;

  AiReviewClientFactory(AiReviewProperties properties) {
    this.properties = properties;
  }

  AiReviewClient create() {
    var requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout((int) CONNECT_TIMEOUT.toMillis());
    requestFactory.setReadTimeout((int) Duration.ofSeconds(properties.timeoutSeconds()).toMillis());

    RestClient restClient =
        RestClient.builder().baseUrl(resolveBaseUrl()).requestFactory(requestFactory).build();

    return switch (properties.provider()) {
      case OPENAI -> new OpenAiReviewClient(restClient, properties);
      case ANTHROPIC -> new AnthropicReviewClient(restClient, properties);
    };
  }

  private String resolveBaseUrl() {
    if (properties.baseUrl() != null && !properties.baseUrl().isBlank()) {
      return properties.baseUrl();
    }
    return properties.provider() == AiReviewProperties.Provider.ANTHROPIC
        ? "https://api.anthropic.com/v1"
        : "https://api.openai.com/v1";
  }
}
