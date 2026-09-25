package io.prtracker.review;

import io.prtracker.common.PageResponse;
import io.prtracker.review.ReviewDtos.ChangeStatus;
import io.prtracker.review.ReviewDtos.CreateReview;
import io.prtracker.review.ReviewDtos.ReviewResponse;
import io.prtracker.review.ReviewDtos.UpdateReview;
import jakarta.validation.Valid;
import java.net.URI;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for tracked PRs.
 *
 * <pre>
 * GET    /api/reviews              list (filter + paging)
 * POST   /api/reviews              create
 * GET    /api/reviews/{id}         read
 * PATCH  /api/reviews/{id}         partial update (details + reviewers)
 * PUT    /api/reviews/{id}/status  change status
 * DELETE /api/reviews/{id}         delete
 * </pre>
 */
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

  private final ReviewService service;

  ReviewController(ReviewService service) {
    this.service = service;
  }

  @GetMapping
  public PageResponse<ReviewResponse> list(
      @RequestParam(required = false) List<PrStatus> status,
      @RequestParam(required = false) String raisedBy,
      @RequestParam(required = false) String reviewer,
      @RequestParam(required = false) String component,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          OffsetDateTime createdFrom,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
          OffsetDateTime createdTo,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "updatedAt") String sort,
      @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
    var filter = new ReviewFilter(status, raisedBy, reviewer, component, createdFrom, createdTo);
    return service.list(filter, page, size, sort, direction);
  }

  @PostMapping
  public ResponseEntity<ReviewResponse> create(@Valid @RequestBody CreateReview request) {
    var created = service.create(request);
    return ResponseEntity.created(URI.create("/api/reviews/" + created.id())).body(created);
  }

  @GetMapping("/{id}")
  public ReviewResponse get(@PathVariable long id) {
    return service.get(id);
  }

  @PatchMapping("/{id}")
  public ReviewResponse update(@PathVariable long id, @Valid @RequestBody UpdateReview request) {
    return service.update(id, request);
  }

  @PutMapping("/{id}/status")
  public ReviewResponse changeStatus(
      @PathVariable long id, @Valid @RequestBody ChangeStatus request) {
    return service.changeStatus(id, request);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }
}
