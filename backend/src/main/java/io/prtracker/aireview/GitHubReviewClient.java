package io.prtracker.aireview;

import io.prtracker.aireview.AiReviewResult.AiReviewComment;
import java.util.List;

/** Reads a PR's diff and posts a review to it. One implementation talks to the real GitHub REST API. */
interface GitHubReviewClient {

  String fetchDiff(String host, String owner, String repo, int prNumber);

  void submitReview(
      String host, String owner, String repo, int prNumber, AiReviewVerdict verdict, String summary, List<AiReviewComment> comments);
}
