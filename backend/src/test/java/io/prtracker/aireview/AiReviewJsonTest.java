package io.prtracker.aireview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AiReviewJsonTest {

  @Test
  void parsesPlainJson() {
    var result = AiReviewJson.parse("{\"summary\":\"ok\",\"verdict\":\"APPROVE\",\"comments\":[]}");

    assertThat(result.summary()).isEqualTo("ok");
    assertThat(result.verdict()).isEqualTo("APPROVE");
  }

  @Test
  void parsesJsonWrappedInAMarkdownFence() {
    String reply = "```json\n{\"summary\":\"ok\",\"verdict\":\"COMMENT\",\"comments\":[]}\n```";

    assertThat(AiReviewJson.parse(reply).verdict()).isEqualTo("COMMENT");
  }

  @Test
  void parsesJsonPrecededByProseTheModelWasNotAskedFor() {
    String reply = "Sure, here's the review:\n{\"summary\":\"ok\",\"verdict\":\"COMMENT\",\"comments\":[]}";

    assertThat(AiReviewJson.parse(reply).verdict()).isEqualTo("COMMENT");
  }

  @Test
  void ignoresUnknownFieldsInsteadOfFailing() {
    String reply = "{\"summary\":\"ok\",\"verdict\":\"COMMENT\",\"comments\":[],\"totally_unexpected\":true}";

    assertThat(AiReviewJson.parse(reply).summary()).isEqualTo("ok");
  }

  @Test
  void rejectsAnEmptyReply() {
    assertThatThrownBy(() -> AiReviewJson.parse("")).isInstanceOf(AiReviewParseException.class);
    assertThatThrownBy(() -> AiReviewJson.parse(null)).isInstanceOf(AiReviewParseException.class);
  }

  @Test
  void rejectsTextThatIsNotJsonAtAll() {
    assertThatThrownBy(() -> AiReviewJson.parse("I refuse to review this PR.")).isInstanceOf(AiReviewParseException.class);
  }
}
