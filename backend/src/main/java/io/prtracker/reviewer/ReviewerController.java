package io.prtracker.reviewer;

import static io.prtracker.common.Constraints.COMPONENT_MESSAGE;
import static io.prtracker.common.Constraints.COMPONENT_PATTERN;

import io.prtracker.reviewer.ReviewerDtos.CreateReviewer;
import io.prtracker.reviewer.ReviewerDtos.ReviewerResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for reviewers and their component grants.
 *
 * <pre>
 * GET    /api/reviewers
 * POST   /api/reviewers
 * DELETE /api/reviewers/{id}
 * PUT    /api/reviewers/{id}/components/{component}   grant (idempotent)
 * DELETE /api/reviewers/{id}/components/{component}   revoke (idempotent)
 * </pre>
 */
@Validated
@RestController
@RequestMapping("/api/reviewers")
public class ReviewerController {

  private final ReviewerService service;

  ReviewerController(ReviewerService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReviewerResponse> list() {
    return service.list();
  }

  @PostMapping
  public ResponseEntity<ReviewerResponse> create(@Valid @RequestBody CreateReviewer request) {
    var created = service.create(request);
    return ResponseEntity.created(URI.create("/api/reviewers/" + created.id())).body(created);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  @PutMapping("/{id}/components/{component}")
  public ReviewerResponse grant(
      @PathVariable long id,
      @PathVariable @Pattern(regexp = COMPONENT_PATTERN, message = COMPONENT_MESSAGE)
          String component) {
    return service.grant(id, component);
  }

  @DeleteMapping("/{id}/components/{component}")
  public ReviewerResponse revoke(
      @PathVariable long id,
      @PathVariable @Pattern(regexp = COMPONENT_PATTERN, message = COMPONENT_MESSAGE)
          String component) {
    return service.revoke(id, component);
  }
}
