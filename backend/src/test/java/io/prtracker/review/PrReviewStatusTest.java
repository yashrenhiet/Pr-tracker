package io.prtracker.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class PrReviewStatusTest {

  @Test
  void blockedStoresTrimmedReason() {
    var review = new PrReview();

    review.changeStatus(PrStatus.BLOCKED, "  merge conflicts ");

    assertThat(review.getStatus()).isEqualTo(PrStatus.BLOCKED);
    assertThat(review.getBlockReason()).isEqualTo("merge conflicts");
  }

  @ParameterizedTest
  @NullAndEmptySource
  @ValueSource(strings = "   ")
  void blockedRequiresReason(String reason) {
    var review = new PrReview();

    assertThatThrownBy(() -> review.changeStatus(PrStatus.BLOCKED, reason))
        .isInstanceOf(IllegalArgumentException.class);
    assertThat(review.getStatus()).isEqualTo(PrStatus.READY_FOR_REVIEW);
  }

  @Test
  void leavingBlockedClearsReason() {
    var review = new PrReview();
    review.changeStatus(PrStatus.BLOCKED, "conflicts");

    review.changeStatus(PrStatus.APPROVED, "ignored");

    assertThat(review.getBlockReason()).isNull();
  }
}
