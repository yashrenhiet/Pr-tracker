package io.prtracker.review;

import static io.prtracker.common.Constraints.COMPONENT_MESSAGE;
import static io.prtracker.common.Constraints.COMPONENT_PATTERN;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Request and response shapes for the {@code /reviews} API. */
public final class ReviewDtos {

  private ReviewDtos() {}

  public record CreateReview(
      @NotBlank String prUrl,
      @NotBlank @Pattern(regexp = COMPONENT_PATTERN, message = COMPONENT_MESSAGE) String component,
      @NotBlank @Size(max = 255) String raisedBy,
      @Size(max = 10_000) String context,
      List<String> internalReviewers,
      List<String> platformReviewers,
      Map<String, String> metadata) {}

  /**
   * Partial update. A null field means "leave unchanged".
   *
   * <p>For {@code context}, a blank string clears the value. For lists and metadata, an empty value
   * clears them. {@code version} is optional; when sent, the update fails with 409 if the record
   * changed since the client last read it.
   */
  public record UpdateReview(
      String prUrl,
      @Pattern(regexp = COMPONENT_PATTERN, message = COMPONENT_MESSAGE) String component,
      @Size(min = 1, max = 255) String raisedBy,
      @Size(max = 10_000) String context,
      List<String> internalReviewers,
      List<String> platformReviewers,
      Map<String, String> metadata,
      Long version) {}

  public record ChangeStatus(@NotNull PrStatus status, @Size(max = 1_000) String blockReason) {}

  public record ReviewResponse(
      long id,
      String prUrl,
      String component,
      PrStatus status,
      String statusLabel,
      String context,
      String raisedBy,
      List<String> internalReviewers,
      List<String> platformReviewers,
      String blockReason,
      Map<String, String> metadata,
      Instant createdAt,
      Instant updatedAt,
      long version) {

    static ReviewResponse from(PrReview r) {
      return new ReviewResponse(
          r.getId(),
          r.getPrUrl(),
          r.getComponent(),
          r.getStatus(),
          r.getStatus().label(),
          r.getContext(),
          r.getRaisedBy(),
          List.copyOf(r.getInternalReviewers()),
          List.copyOf(r.getPlatformReviewers()),
          r.getBlockReason(),
          Map.copyOf(r.getMetadata()),
          r.getCreatedAt(),
          r.getUpdatedAt(),
          r.getVersion());
    }
  }
}
