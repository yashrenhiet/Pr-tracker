package io.prtracker.review;

import java.time.OffsetDateTime;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
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
              (root, query, cb) ->
                  cb.or(
                      arrayHas(cb, root.get("internalReviewers"), who),
                      arrayHas(cb, root.get("platformReviewers"), who)));
    }
    if (createdFrom != null) {
      var from = createdFrom.toInstant();
      spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), from));
    }
    if (createdTo != null) {
      var to = createdTo.toInstant();
      spec = spec.and((root, query, cb) -> cb.lessThan(root.get("createdAt"), to));
    }
    return spec;
  }

  private static Specification<PrReview> equalsIgnoreCase(String field, String value) {
    String needle = value.trim().toLowerCase();
    return (root, query, cb) -> cb.equal(cb.lower(root.get(field)), needle);
  }

  /**
   * True when {@code value} is an element of the array {@code column}.
   *
   * <p>Not Hibernate's {@code collectionContains}: it binds the value as {@code varchar[]}, and
   * Postgres has no {@code text[] @> varchar[]} operator. Hibernate's {@code array_position} takes
   * {@code anycompatible} and returns 0, not NULL, when absent (it wraps the call in {@code
   * coalesce(..., 0)}), hence {@code > 0}. The value is bound as a parameter, not inlined.
   */
  private static Predicate arrayHas(CriteriaBuilder cb, Expression<?> column, String value) {
    var bound = ((HibernateCriteriaBuilder) cb).value(value);
    return cb.greaterThan(cb.function("array_position", Integer.class, column, bound), 0);
  }

  private static boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
