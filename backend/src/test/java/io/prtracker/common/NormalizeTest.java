package io.prtracker.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;

class NormalizeTest {

  @Test
  void namesTrimDropBlanksAndDedupeIgnoringCase() {
    var result = Normalize.names(Arrays.asList(" ann ", "", null, "Bob", "ANN", "bob "));

    assertThat(result).containsExactly("ann", "Bob");
  }

  @Test
  void namesOfNullIsEmpty() {
    assertThat(Normalize.names(null)).isEmpty();
  }

  @Test
  void metadataDropsBlankKeysAndValues() {
    var input = new HashMap<String, String>();
    input.put(" ticket ", " ABC-1 ");
    input.put("empty", " ");
    input.put(" ", "orphan");
    input.put("nullValue", null);

    assertThat(Normalize.metadata(input)).isEqualTo(Map.of("ticket", "ABC-1"));
  }

  @Test
  void blankToNull() {
    assertThat(Normalize.blankToNull("  ")).isNull();
    assertThat(Normalize.blankToNull(" x ")).isEqualTo("x");
  }
}
