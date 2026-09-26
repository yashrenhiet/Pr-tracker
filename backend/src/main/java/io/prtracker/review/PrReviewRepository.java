package io.prtracker.review;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PrReviewRepository
    extends JpaRepository<PrReview, Long>, JpaSpecificationExecutor<PrReview> {

  /** Used by {@code AiReviewScheduler} to find PRs due for an automatic AI review pass. */
  Page<PrReview> findByStatusIn(List<PrStatus> statuses, Pageable pageable);
}
