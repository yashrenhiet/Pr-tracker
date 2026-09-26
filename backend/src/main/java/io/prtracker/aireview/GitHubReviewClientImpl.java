package io.prtracker.aireview;

import io.prtracker.aireview.AiReviewResult.AiReviewComment;
import java.time.Duration;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Talks to the GitHub REST API, plain — no MCP server, no GitHub App. A personal access token with
 * {@code repo} scope (classic) or Contents/Pull requests read-and-write (fine-grained) is enough.
 *
 * <p>Works against GitHub Enterprise too: {@code github.com} uses {@code api.github.com}; any other
 * host uses {@code https://<host>/api/v3}, the standard GHE REST API path.
 */
@Component
class GitHubReviewClientImpl implements GitHubReviewClient {

  private static final String API_VERSION = "2022-11-28";

  private final AiReviewProperties properties;
  private final RestClient restClient;

  GitHubReviewClientImpl(AiReviewProperties properties) {
    this.properties = properties;
    var requestFactory = new SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
    requestFactory.setReadTimeout((int) Duration.ofSeconds(30).toMillis());
    this.restClient = RestClient.builder().requestFactory(requestFactory).build();
  }

  @Override
  public String fetchDiff(String host, String owner, String repo, int prNumber) {
    requireToken();
    try {
      return restClient
          .get()
          .uri(apiBase(host) + "/repos/{owner}/{repo}/pulls/{number}", owner, repo, prNumber)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.githubToken())
          .header(HttpHeaders.ACCEPT, "application/vnd.github.v3.diff")
          .header("X-GitHub-Api-Version", API_VERSION)
          .retrieve()
          .body(String.class);
    } catch (RestClientException e) {
      throw new AiReviewProviderException("GitHub diff fetch failed: " + e.getMessage(), e);
    }
  }

  @Override
  public void submitReview(
      String host, String owner, String repo, int prNumber, AiReviewVerdict verdict, String summary, List<AiReviewComment> comments) {
    requireToken();
    var request =
        new ReviewRequest(
            summary,
            verdict.name(),
            comments.stream()
                .map(c -> new ReviewRequest.Comment(c.path(), c.line(), "**[%s]** %s".formatted(c.severity(), c.message())))
                .toList());
    try {
      restClient
          .post()
          .uri(apiBase(host) + "/repos/{owner}/{repo}/pulls/{number}/reviews", owner, repo, prNumber)
          .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.githubToken())
          .header(HttpHeaders.ACCEPT, "application/vnd.github+json")
          .header("X-GitHub-Api-Version", API_VERSION)
          .contentType(MediaType.APPLICATION_JSON)
          .body(request)
          .retrieve()
          .toBodilessEntity();
    } catch (RestClientException e) {
      throw new AiReviewProviderException("GitHub review submission failed: " + e.getMessage(), e);
    }
  }

  private void requireToken() {
    if (!properties.githubConfigured()) {
      throw new AiReviewNotConfiguredException(
          "AI_REVIEW_GITHUB_TOKEN is not set — cannot read PR diffs or post review comments.");
    }
  }

  private static String apiBase(String host) {
    return "github.com".equalsIgnoreCase(host) ? "https://api.github.com" : "https://" + host + "/api/v3";
  }

  private record ReviewRequest(String body, String event, List<Comment> comments) {
    record Comment(String path, int line, String body) {}
  }
}
