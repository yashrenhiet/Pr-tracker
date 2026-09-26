package io.prtracker.aireview;

import io.prtracker.review.PrReview;

/**
 * Builds the two-part prompt sent to the configured LLM: a fixed system prompt defining the JSON
 * contract, and a per-review user prompt carrying the PR's metadata and diff.
 */
final class ReviewPromptBuilder {

  private ReviewPromptBuilder() {}

  static String systemPrompt() {
    return """
        You are an experienced software engineer performing a pull request code review. Review the
        diff for correctness, security, error handling, test coverage, and readability.

        Respond with ONLY a JSON object in exactly this shape — no prose, no markdown code fences:

        {
          "summary": "one paragraph describing what changed and your overall assessment",
          "verdict": "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
          "comments": [
            {"path": "relative/file/path", "line": 42, "severity": "MUST_FIX" | "SHOULD_FIX" | "NIT", "message": "..."}
          ]
        }

        Rules:
        - Only comment on lines that appear in the diff below. "line" is the line number in the NEW
          version of the file, exactly as shown by the diff's hunk headers (the number after the
          '+' in an "@@ -a,b +c,d @@" header, counting every context and added line from there).
        - Never invent a file path or line number that is not part of the diff.
        - Use MUST_FIX for correctness, security, or data-loss bugs; SHOULD_FIX for design,
          maintainability, or missing-test issues worth fixing; NIT for optional polish.
        - If the diff has no issues worth raising, return an empty "comments" array and verdict
          "APPROVE".
        - Prefer REQUEST_CHANGES only when at least one comment is MUST_FIX.
        """;
  }

  static String userPrompt(PrReview review, String diff) {
    String context = review.getContext() == null || review.getContext().isBlank()
        ? ""
        : "\nContext from the author: " + review.getContext() + "\n";

    return """
        # Pull request: %s
        Component: %s
        Raised by: %s
        %s
        ## Diff
        ```diff
        %s
        ```
        """
        .formatted(review.getPrUrl(), review.getComponent(), review.getRaisedBy(), context, diff);
  }
}
