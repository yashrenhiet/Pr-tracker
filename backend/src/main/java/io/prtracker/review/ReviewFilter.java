package io.prtracker.review;

import java.time.OffsetDateTime;
import java.util.List;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.springframework.data.jpa.domain.Specification;

/**
 * Filter criteria for listing reviews. Every field is optional; null or blank means "no filter".
 *
 * <p>{@code reviewer} matches either the internal or the platform reviewer list.
 */
public record ReviewFilter(
    List<PrStatus> statuses,
    String raisedBy,
    String reviewer,
    String component,
    OffsetDateTime createdFrom,
    OffsetDateTime createdTo) {

  public Specification<PrReview> toSpecification() {
    Specification<PrReview> spec = Specification.unrestricted();

    if (statuses != null && !statuses.isEmpty()) {
      spec = spec.and((root, query, cb) -> root.get("status").in(statuses));
    }
    if (hasText(raisedBy)) {
      spec = spec.and(equalsIgnoreCase("raisedBy", raisedBy));
    }
    if (hasText(component)) {
      spec = spec.and(equalsIgnoreCase("component", component));
    }
    if (hasText(reviewer)) {
      String who = reviewer.trim();
      spec =
          spec.and(
              (root, query, cb) -> {
                var hcb = (HibernateCriteriaBuilder) cb;
                return hcb.or(
                    hcb.collectionContains(root.get("internalReviewers"), who),
                    hcb.collectionContains(root.get("platformReviewers"), who));
              });
    }
    if (createdFrom != null) {
      spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), createdFrom));
    }
    if (createdTo != null) {
      spec = spec.and((root, query, cb) -> cb.lessThan(root.get("createdAt"), createdTo));
    }
    return spec;
  }

  private static Specification<PrReview> equalsIgnoreCase(String field, String value) {
    String needle = value.trim().toLowerCase();
    return (root, query, cb) -> cb.equal(cb.lower(root.get(field)), needle);
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
