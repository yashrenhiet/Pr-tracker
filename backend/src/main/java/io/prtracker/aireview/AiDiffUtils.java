package io.prtracker.aireview;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses a unified diff just enough to (a) know which line numbers in the new version of each file
 * actually exist in the diff the model was shown, and (b) truncate an oversized diff without
 * cutting a file's hunk in half.
 *
 * <p>{@link #parseCommentableLines} is the ground truth {@link AiReviewResultValidator} checks
 * every comment against, so a hallucinated {@code path}/{@code line} pair is dropped before it
 * either corrupts the stored review or gets rejected by GitHub's own API with a confusing error.
 */
public final class AiDiffUtils {

  private static final Pattern FILE_HEADER = Pattern.compile("^\\+\\+\\+ b/(.+)$");
  private static final Pattern HUNK_HEADER = Pattern.compile("^@@ -\\d+(?:,\\d+)? \\+(\\d+)(?:,\\d+)? @@.*$");

  private AiDiffUtils() {}

  /**
   * {@code path -> line numbers} for every line shown in a hunk of the new file version (context
   * lines included, not just added ones — GitHub accepts a review comment on either, and the
   * prompt already tells the model to prefer added lines).
   */
  public static Map<String, Set<Integer>> parseCommentableLines(String diff) {
    Map<String, Set<Integer>> result = new LinkedHashMap<>();
    if (diff == null || diff.isBlank()) {
      return result;
    }

    String currentFile = null;
    int newLine = 0;
    boolean inHunk = false;

    for (String line : diff.split("\n", -1)) {
      if (line.startsWith("diff --git ")) {
        currentFile = null;
        inHunk = false;
        continue;
      }
      Matcher fileMatcher = FILE_HEADER.matcher(line);
      if (fileMatcher.matches()) {
        currentFile = "/dev/null".equals(fileMatcher.group(1)) ? null : fileMatcher.group(1);
        inHunk = false;
        continue;
      }
      Matcher hunkMatcher = HUNK_HEADER.matcher(line);
      if (hunkMatcher.matches()) {
        newLine = Integer.parseInt(hunkMatcher.group(1));
        inHunk = true;
        continue;
      }
      if (!inHunk || currentFile == null || line.isEmpty()) {
        continue;
      }
      switch (line.charAt(0)) {
        case '+' -> {
          result.computeIfAbsent(currentFile, f -> new TreeSet<>()).add(newLine);
          newLine++;
        }
        case ' ' -> {
          result.computeIfAbsent(currentFile, f -> new TreeSet<>()).add(newLine);
          newLine++;
        }
        default -> {
          // '-' (removed, not part of the new file) and '\' (no-newline marker): no-op.
        }
      }
    }
    return result;
  }

  /**
   * Truncates at the last complete file's diff before {@code maxChars}, rather than mid-hunk, so
   * the model never sees a file half-explained. Appends a note naming the cutoff so both the model
   * and a human reading the stored diff know files were left out.
   */
  public static String truncate(String diff, int maxChars) {
    if (diff == null) {
      return "";
    }
    if (diff.length() <= maxChars) {
      return diff;
    }
    int cut = diff.lastIndexOf("\ndiff --git ", maxChars);
    String kept = cut > 0 ? diff.substring(0, cut) : diff.substring(0, maxChars);
    return kept
        + "\n\n... diff truncated at "
        + maxChars
        + " characters; remaining files were not included in this review ...\n";
  }
}
