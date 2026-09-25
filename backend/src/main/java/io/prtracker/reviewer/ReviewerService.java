package io.prtracker.reviewer;

import io.prtracker.common.NotFoundException;
import io.prtracker.reviewer.ReviewerDtos.CreateReviewer;
import io.prtracker.reviewer.ReviewerDtos.ReviewerResponse;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewerService {

  private final ReviewerRepository repository;

  ReviewerService(ReviewerRepository repository) {
    this.repository = repository;
  }

  @Transactional(readOnly = true)
  public List<ReviewerResponse> list() {
    return repository.findAll(Sort.by("name")).stream().map(ReviewerResponse::from).toList();
  }

  /**
   * Duplicate email/handle is caught by the unique indexes and mapped to 409, rather than a
   * check-then-insert that would race.
   */
  @Transactional
  public ReviewerResponse create(CreateReviewer request) {
    var reviewer =
        new Reviewer(request.name().trim(), request.email().trim(), request.handle().trim());
    return ReviewerResponse.from(repository.saveAndFlush(reviewer));
  }

  @Transactional
  public void delete(long id) {
    repository.delete(find(id));
  }

  /** Idempotent: granting an existing component is a no-op. */
  @Transactional
  public ReviewerResponse grant(long id, String component) {
    var reviewer = find(id);
    if (reviewer.grant(component.trim())) {
      repository.saveAndFlush(reviewer);
    }
    return ReviewerResponse.from(reviewer);
  }

  /** Idempotent: revoking a component the reviewer lacks is a no-op. */
  @Transactional
  public ReviewerResponse revoke(long id, String component) {
    var reviewer = find(id);
    if (reviewer.revoke(component.trim())) {
      repository.saveAndFlush(reviewer);
    }
    return ReviewerResponse.from(reviewer);
  }

  private Reviewer find(long id) {
    return repository.findById(id).orElseThrow(() -> new NotFoundException("Reviewer", id));
  }
}
