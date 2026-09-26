package io.prtracker.aireview;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Parses a model reply into {@link AiReviewResult}, tolerating the two ways LLMs routinely ignore a
 * "return only JSON" instruction: wrapping the object in a ```json fence, or prefixing it with a
 * sentence of prose. Deliberately its own tiny mapper (not the app's shared Jackson bean) so a
 * future customisation of that bean can't accidentally start rejecting model output.
 */
final class AiReviewJson {

  private static final ObjectMapper MAPPER =
      new ObjectMapper().configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

  private AiReviewJson() {}

  static AiReviewResult parse(String reply) {
    if (reply == null || reply.isBlank()) {
      throw new AiReviewParseException("Model returned an empty reply");
    }
    String json = extractJsonObject(reply);
    try {
      return MAPPER.readValue(json, AiReviewResult.class);
    } catch (Exception e) {
      throw new AiReviewParseException("Model reply is not valid JSON: " + e.getMessage());
    }
  }

  private static String extractJsonObject(String reply) {
    String trimmed = reply.trim();
    if (trimmed.startsWith("```")) {
      int firstNewline = trimmed.indexOf('\n');
      int lastFence = trimmed.lastIndexOf("```");
      if (firstNewline > 0 && lastFence > firstNewline) {
        trimmed = trimmed.substring(firstNewline + 1, lastFence).trim();
      }
    }
    int start = trimmed.indexOf('{');
    int end = trimmed.lastIndexOf('}');
    return start >= 0 && end > start ? trimmed.substring(start, end + 1) : trimmed;
  }
}
