package io.prtracker.aireview;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Calls Anthropic's Messages API. */
final class AnthropicReviewClient implements AiReviewClient {

  private static final int MAX_OUTPUT_TOKENS = 4096;

  private final RestClient restClient;
  private final AiReviewProperties properties;

  AnthropicReviewClient(RestClient restClient, AiReviewProperties properties) {
    this.restClient = restClient;
    this.properties = properties;
  }

  @Override
  public String chat(String systemPrompt, String userPrompt) {
    var request =
        new Request(
            properties.resolvedModel(),
            MAX_OUTPUT_TOKENS,
            systemPrompt,
            List.of(new Request.Message("user", userPrompt)));

    Response response;
    try {
      response =
          restClient
              .post()
              .uri("/messages")
              .header("x-api-key", properties.apiKey())
              .header("anthropic-version", "2023-06-01")
              .contentType(MediaType.APPLICATION_JSON)
              .body(request)
              .retrieve()
              .body(Response.class);
    } catch (RestClientException e) {
      throw new AiReviewProviderException("Anthropic request failed: " + e.getMessage(), e);
    }

    if (response == null || response.content() == null || response.content().isEmpty()) {
      throw new AiReviewProviderException("Anthropic returned no content");
    }
    return response.content().get(0).text();
  }

  private record Request(String model, @JsonProperty("max_tokens") int maxTokens, String system, List<Message> messages) {
    record Message(String role, String content) {}
  }

  private record Response(List<Content> content) {
    record Content(String type, String text) {}
  }
}
