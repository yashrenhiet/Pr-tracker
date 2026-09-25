package io.prtracker.review;

import java.util.regex.Pattern;

/**
 * A parsed GitHub (or GitHub Enterprise) pull request URL.
 *
 * <p>{@link #canonical()} strips query strings, fragments and sub-paths such as {@code /files}, so
 * the same PR always maps to the same stored URL and the unique constraint actually works.
 */
public record PrUrl(String host, String owner, String repo, int number) {

  private static final Pattern PATTERN =
      Pattern.compile("^https?://([^/\\s]+)/([^/\\s]+)/([^/\\s]+)/pull/(\\d+)(?:[/?#]\\S*)?$");

  public static PrUrl parse(String raw) {
    if (raw == null || raw.isBlank()) {
      throw new IllegalArgumentException("prUrl is required");
    }
    var matcher = PATTERN.matcher(raw.trim());
    if (!matcher.matches()) {
      throw new IllegalArgumentException(
          "prUrl must look like https://<host>/<owner>/<repo>/pull/<number>: " + raw);
    }
    return new PrUrl(
        matcher.group(1).toLowerCase(),
        matcher.group(2),
        matcher.group(3),
        Integer.parseInt(matcher.group(4)));
  }

  public String canonical() {
    return "https://%s/%s/%s/pull/%d".formatted(host, owner, repo, number);
  }
}
