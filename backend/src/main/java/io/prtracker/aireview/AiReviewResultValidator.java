package io.prtracker.aireview;

import io.prtracker.aireview.AiReviewResult.AiReviewComment;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Grounds the model's self-reported review against the diff it was actually shown, and normalises
 * the free-form fields it was asked to fill in. This is the feature that stops a hallucinated
 * comment — wrong file, a line that isn't part of the diff, an invented severity — from ever
 * reaching GitHub or the run's stored result: it is dropped here, with the reason logged by the
 * caller, rather than failing the whole review over one bad comment.
 */
final class AiReviewResultValidator {

  private static final Set<String> VALID_SEVERITIES = Set.of("MUST_FIX", "SHOULD_FIX", "NIT");

  private AiReviewResultValidator() {}

  record Validated(String summary, AiReviewVerdict verdict, List<AiReviewComment> comments, List<String> rejections) {}

  static Validated validate(AiReviewResult raw, Map<String, Set<Integer>> commentableLines) {
    List<String> rejections = new ArrayList<>();

    String summary =
        raw.summary() == null || raw.summary().isBlank()
            ? "(the model did not provide a summary)"
            : raw.summary().trim();

    AiReviewVerdict verdict = normalizeVerdict(raw.verdict(), rejections);

    List<AiReviewComment> comments = new ArrayList<>();
    for (AiReviewComment comment : raw.comments() == null ? List.<AiReviewComment>of() : raw.comments()) {
      String rejectionReason = rejectionReasonFor(comment, commentableLines);
      if (rejectionReason == null) {
        comments.add(normalizeSeverity(comment));
      } else {
        rejections.add(
            "dropped comment on %s:%d — %s".formatted(comment.path(), comment.line(), rejectionReason));
      }
    }

    return new Validated(summary, verdict, List.copyOf(comments), List.copyOf(rejections));
  }

  private static AiReviewVerdict normalizeVerdict(String raw, List<String> rejections) {
    try {
      return AiReviewVerdict.valueOf((raw == null ? "" : raw.trim()).toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException e) {
      rejections.add("verdict '" + raw + "' is not APPROVE/REQUEST_CHANGES/COMMENT — defaulted to COMMENT");
      return AiReviewVerdict.COMMENT;
    }
  }

  private static String rejectionReasonFor(AiReviewComment comment, Map<String, Set<Integer>> commentableLines) {
    if (comment.path() == null || comment.path().isBlank()) {
      return "missing file path";
    }
    if (comment.message() == null || comment.message().isBlank()) {
      return "missing message";
    }
    if (comment.line() <= 0) {
      return "line must be positive";
    }
    Set<Integer> lines = commentableLines.get(comment.path());
    if (lines == null) {
      return "path is not part of the diff";
    }
    if (!lines.contains(comment.line())) {
      return "line " + comment.line() + " is not part of the diff for this file";
    }
    return null;
  }

  private static AiReviewComment normalizeSeverity(AiReviewComment comment) {
    String severity = comment.severity() == null ? "" : comment.severity().trim().toUpperCase(Locale.ROOT);
    String resolved = VALID_SEVERITIES.contains(severity) ? severity : "SHOULD_FIX";
    return new AiReviewComment(comment.path(), comment.line(), resolved, comment.message().trim());
  }
}
