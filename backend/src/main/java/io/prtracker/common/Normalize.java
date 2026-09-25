package io.prtracker.common;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/** Small input-normalisation helpers shared by the services. */
public final class Normalize {

  private Normalize() {}

  /** Trims, returns null for blank. Use for optional text fields where "" means "clear". */
  public static String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  /** Trims entries, drops blanks, removes case-insensitive duplicates (first spelling wins). */
  public static List<String> names(List<String> values) {
    if (values == null) {
      return List.of();
    }
    var seen = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
    var result = new ArrayList<String>();
    for (String value : values) {
      String trimmed = blankToNull(value);
      if (trimmed != null && seen.add(trimmed)) {
        result.add(trimmed);
      }
    }
    return result;
  }

  /** Trims keys and values, drops entries with a blank key or value. */
  public static Map<String, String> metadata(Map<String, String> values) {
    var result = new LinkedHashMap<String, String>();
    if (values != null) {
      values.forEach(
          (key, value) -> {
            String k = blankToNull(key);
            String v = blankToNull(value);
            if (k != null && v != null) {
              result.put(k, v);
            }
          });
    }
    return result;
  }
}
