package io.prtracker.review;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PrReviewRepository
    extends JpaRepository<PrReview, Long>, JpaSpecificationExecutor<PrReview> {}
