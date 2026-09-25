package io.prtracker.review;

import static io.prtracker.common.Normalize.blankToNull;
import static io.prtracker.common.Normalize.metadata;
import static io.prtracker.common.Normalize.names;

import io.prtracker.common.NotFoundException;
import io.prtracker.common.PageResponse;
import io.prtracker.review.ReviewDtos.ChangeStatus;
import io.prtracker.review.ReviewDtos.CreateReview;
import io.prtracker.review.ReviewDtos.ReviewResponse;
import io.prtracker.review.ReviewDtos.UpdateReview;
import java.util.Set;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {

  static final int MAX_PAGE_SIZE = 100;
  static final Set<String> SORTABLE_FIELDS =
      Set.of("createdAt", "updatedAt", "status", "raisedBy", "component");

  private final PrReviewRepository repository;

  ReviewService(PrReviewRepository repository) {
    this.repository = repository;
  }

  @Transactional(readOnly = true)
  public PageResponse<ReviewResponse> list(
      ReviewFilter filter, int page, int size, String sort, Sort.Direction direction) {
    if (page < 0) {
      throw new IllegalArgumentException("page must be >= 0");
    }
    if (size < 1 || size > MAX_PAGE_SIZE) {
      throw new IllegalArgumentException("size must be between 1 and " + MAX_PAGE_SIZE);
    }
    if (!SORTABLE_FIELDS.contains(sort)) {
      throw new IllegalArgumentException("sort must be one of " + SORTABLE_FIELDS);
    }
    if (filter.createdFrom() != null
        && filter.createdTo() != null
        && !filter.createdFrom().isBefore(filter.createdTo())) {
      throw new IllegalArgumentException("createdFrom must be before createdTo");
    }
    // Secondary sort on id keeps paging stable when many rows share the primary sort value.
    var pageable = PageRequest.of(page, size, Sort.by(direction, sort).and(Sort.by(direction, "id")));
    return PageResponse.of(
        repository.findAll(filter.toSpecification(), pageable), ReviewResponse::from);
  }

  @Transactional(readOnly = true)
  public ReviewResponse get(long id) {
    return ReviewResponse.from(find(id));
  }

  @Transactional
  public ReviewResponse create(CreateReview request) {
    var review = new PrReview();
    review.setPrUrl(PrUrl.parse(request.prUrl()).canonical());
    review.setComponent(request.component().trim());
    review.setRaisedBy(request.raisedBy().trim());
    review.setContext(blankToNull(request.context()));
    review.setInternalReviewers(names(request.internalReviewers()));
    review.setPlatformReviewers(names(request.platformReviewers()));
    review.setMetadata(metadata(request.metadata()));
    // saveAndFlush so a duplicate URL surfaces here as a 409, not later at commit time.
    return ReviewResponse.from(repository.saveAndFlush(review));
  }

  @Transactional
  public ReviewResponse update(long id, UpdateReview request) {
    var review = find(id);
    if (request.version() != null && request.version() != review.getVersion()) {
      throw new ObjectOptimisticLockingFailureException(PrReview.class, id);
    }
    if (request.prUrl() != null) {
      review.setPrUrl(PrUrl.parse(request.prUrl()).canonical());
    }
    if (request.component() != null) {
      review.setComponent(request.component().trim());
    }
    if (request.raisedBy() != null) {
      String raisedBy = blankToNull(request.raisedBy());
      if (raisedBy == null) {
        throw new IllegalArgumentException("raisedBy must not be blank");
      }
      review.setRaisedBy(raisedBy);
    }
    if (request.context() != null) {
      review.setContext(blankToNull(request.context()));
    }
    if (request.internalReviewers() != null) {
      review.setInternalReviewers(names(request.internalReviewers()));
    }
    if (request.platformReviewers() != null) {
      review.setPlatformReviewers(names(request.platformReviewers()));
    }
    if (request.metadata() != null) {
      review.setMetadata(metadata(request.metadata()));
    }
    return ReviewResponse.from(repository.saveAndFlush(review));
  }

  @Transactional
  public ReviewResponse changeStatus(long id, ChangeStatus request) {
    var review = find(id);
    review.changeStatus(request.status(), request.blockReason());
    return ReviewResponse.from(repository.saveAndFlush(review));
  }

  @Transactional
  public void delete(long id) {
    repository.delete(find(id));
  }

  private PrReview find(long id) {
    return repository.findById(id).orElseThrow(() -> new NotFoundException("Review", id));
  }
}
