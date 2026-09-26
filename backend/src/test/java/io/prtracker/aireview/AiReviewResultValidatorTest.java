package io.prtracker.aireview;

import static org.assertj.core.api.Assertions.assertThat;

import io.prtracker.aireview.AiReviewResult.AiReviewComment;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.Test;

class AiReviewResultValidatorTest {

  private static final Map<String, Set<Integer>> LINES = Map.of("Foo.java", new TreeSet<>(Set.of(10, 11, 12)));

  @Test
  void keepsACommentOnALineThatIsActuallyInTheDiff() {
    var raw = new AiReviewResult("looks fine", "APPROVE", List.of(new AiReviewComment("Foo.java", 11, "nit", "tidy this up")));

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.comments()).hasSize(1);
    assertThat(validated.comments().getFirst().severity()).isEqualTo("NIT");
    assertThat(validated.rejections()).isEmpty();
  }

  @Test
  void dropsACommentOnALineNotInTheDiffAndRecordsWhy() {
    var raw = new AiReviewResult("s", "COMMENT", List.of(new AiReviewComment("Foo.java", 999, "must_fix", "bug")));

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.comments()).isEmpty();
    assertThat(validated.rejections()).hasSize(1);
    assertThat(validated.rejections().getFirst()).contains("999").contains("not part of the diff");
  }

  @Test
  void dropsACommentOnAFileThatIsNotInTheDiffAtAll() {
    var raw = new AiReviewResult("s", "COMMENT", List.of(new AiReviewComment("Nonexistent.java", 1, "nit", "hi")));

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.comments()).isEmpty();
    assertThat(validated.rejections().getFirst()).contains("not part of the diff");
  }

  @Test
  void dropsACommentMissingAPathOrMessage() {
    var raw =
        new AiReviewResult(
            "s",
            "COMMENT",
            List.of(new AiReviewComment(null, 10, "nit", "hi"), new AiReviewComment("Foo.java", 10, "nit", " ")));

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.comments()).isEmpty();
    assertThat(validated.rejections()).hasSize(2);
  }

  @Test
  void defaultsAnUnknownSeverityToShouldFixRatherThanDroppingTheComment() {
    var raw = new AiReviewResult("s", "COMMENT", List.of(new AiReviewComment("Foo.java", 10, "made-up-severity", "hi")));

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.comments()).hasSize(1);
    assertThat(validated.comments().getFirst().severity()).isEqualTo("SHOULD_FIX");
  }

  @Test
  void defaultsAnUnknownVerdictToCommentAndRecordsWhy() {
    var raw = new AiReviewResult("s", "LGTM!!!", List.of());

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.verdict()).isEqualTo(AiReviewVerdict.COMMENT);
    assertThat(validated.rejections()).hasSize(1);
  }

  @Test
  void fillsInAPlaceholderSummaryWhenTheModelOmitsOne() {
    var raw = new AiReviewResult(null, "APPROVE", List.of());

    var validated = AiReviewResultValidator.validate(raw, LINES);

    assertThat(validated.summary()).isNotBlank();
  }
}
