package io.prtracker.aireview;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AiDiffUtilsTest {

  private static final String DIFF =
      """
      diff --git a/src/Foo.java b/src/Foo.java
      index abc123..def456 100644
      --- a/src/Foo.java
      +++ b/src/Foo.java
      @@ -10,4 +10,6 @@ class Foo {
       context before
      -    int x = 1;
      +    int x = 2;
      +    int y = 3;
       context after
      diff --git a/src/deleted.txt b/src/deleted.txt
      deleted file mode 100644
      --- a/src/deleted.txt
      +++ /dev/null
      @@ -1,2 +0,0 @@
      -gone
      -also gone
      """;

  @Test
  void indexesContextAndAddedLinesInTheNewFile() {
    Map<String, Set<Integer>> lines = AiDiffUtils.parseCommentableLines(DIFF);

    // 10: context, 11: added (x=2), 12: added (y=3), 13: context. The removed "int x = 1;" line
    // never existed in the new file, so it must not appear.
    assertThat(lines.get("src/Foo.java")).containsExactly(10, 11, 12, 13);
  }

  @Test
  void ignoresDeletedFiles() {
    Map<String, Set<Integer>> lines = AiDiffUtils.parseCommentableLines(DIFF);

    assertThat(lines).doesNotContainKey("src/deleted.txt");
  }

  @Test
  void handlesBlankAndNullInput() {
    assertThat(AiDiffUtils.parseCommentableLines(null)).isEmpty();
    assertThat(AiDiffUtils.parseCommentableLines("")).isEmpty();
  }

  @Test
  void leavesShortDiffsUntouched() {
    assertThat(AiDiffUtils.truncate(DIFF, 10_000)).isEqualTo(DIFF);
    assertThat(AiDiffUtils.truncate(null, 10)).isEmpty();
  }

  @Test
  void truncatesAtTheLastCompleteFileBoundary() {
    String truncated = AiDiffUtils.truncate(DIFF, DIFF.indexOf("diff --git a/src/deleted.txt") + 5);

    assertThat(truncated).startsWith("diff --git a/src/Foo.java");
    assertThat(truncated).doesNotContain("deleted.txt");
    assertThat(truncated).contains("truncated at");
  }
}
