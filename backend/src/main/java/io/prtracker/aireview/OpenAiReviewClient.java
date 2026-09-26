package io.prtracker.aireview;

import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Calls OpenAI's Chat Completions API (or any OpenAI-compatible endpoint via {@code baseUrl}). */
final class OpenAiReviewClient implements AiReviewClient {

  private final RestClient restClient;
  private final AiReviewProperties properties;

  OpenAiReviewClient(RestClient restClient, AiReviewProperties properties) {
    this.restClient = restClient;
    this.properties = properties;
  }

  @Override
  public String chat(String systemPrompt, String userPrompt) {
    var request =
        new Request(
            properties.resolvedModel(),
            List.of(new Request.Message("system", systemPrompt), new Request.Message("user", userPrompt)),
            0.2);

    Response response;
    try {
      response =
          restClient
              .post()
              .uri("/chat/completions")
              .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
              .contentType(MediaType.APPLICATION_JSON)
              .body(request)
              .retrieve()
              .body(Response.class);
    } catch (RestClientException e) {
      throw new AiReviewProviderException("OpenAI request failed: " + e.getMessage(), e);
    }

    if (response == null || response.choices() == null || response.choices().isEmpty()) {
      throw new AiReviewProviderException("OpenAI returned no choices");
    }
    return response.choices().get(0).message().content();
  }

  private record Request(String model, List<Message> messages, double temperature) {
    record Message(String role, String content) {}
  }

  private record Response(List<Choice> choices) {
    record Choice(Message message) {}

    record Message(String content) {}
  }
}
