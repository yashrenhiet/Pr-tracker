package io.prtracker.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class PrUrlTest {

  @ParameterizedTest
  @ValueSource(
      strings = {
        "https://github.com/acme/api/pull/42",
        "https://GitHub.com/acme/api/pull/42/files",
        "https://github.com/acme/api/pull/42?diff=split",
        "https://github.com/acme/api/pull/42#discussion_r1",
        "  https://github.com/acme/api/pull/42  "
      })
  void canonicalisesVariantsOfTheSamePr(String raw) {
    assertThat(PrUrl.parse(raw).canonical()).isEqualTo("https://github.com/acme/api/pull/42");
  }

  @Test
  void supportsEnterpriseHosts() {
    var url = PrUrl.parse("http://git.example.com/team/svc/pull/7");

    assertThat(url).isEqualTo(new PrUrl("git.example.com", "team", "svc", 7));
  }

  @ParameterizedTest
  @NullAndEmptySource
  @ValueSource(
      strings = {
        "https://github.com/acme/api/issues/42",
        "https://github.com/acme/pull/42",
        "https://github.com/acme/api/pull/abc",
        "ftp://github.com/acme/api/pull/1",
        "github.com/acme/api/pull/1"
      })
  void rejectsNonPrUrls(String raw) {
    assertThatThrownBy(() -> PrUrl.parse(raw)).isInstanceOf(IllegalArgumentException.class);
  }
}
