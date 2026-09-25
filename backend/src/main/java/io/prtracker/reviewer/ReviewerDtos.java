package io.prtracker.reviewer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;

/** Request and response shapes for the {@code /reviewers} API. */
public final class ReviewerDtos {

  private ReviewerDtos() {}

  public record CreateReviewer(
      @NotBlank @Size(max = 255) String name,
      @NotBlank @Email @Size(max = 255) String email,
      @NotBlank
          @Pattern(
              regexp = "[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})",
              message = "must be a valid username (letters, digits, '-')")
          String handle) {}

  public record ReviewerResponse(
      long id,
      String name,
      String email,
      String handle,
      List<String> components,
      OffsetDateTime createdAt,
      OffsetDateTime updatedAt) {

    static ReviewerResponse from(Reviewer r) {
      return new ReviewerResponse(
          r.getId(),
          r.getName(),
          r.getEmail(),
          r.getHandle(),
          r.getComponents().stream().sorted(String.CASE_INSENSITIVE_ORDER).toList(),
          r.getCreatedAt(),
          r.getUpdatedAt());
    }
  }
}
