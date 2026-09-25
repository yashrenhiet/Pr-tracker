package io.prtracker.common;

import java.util.Map;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Maps domain and persistence exceptions to RFC 9457 problem responses.
 *
 * <p>Validation and malformed-request errors are handled by the {@link
 * ResponseEntityExceptionHandler} base class.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

  /** Unique constraints from V1__init.sql mapped to user-facing messages. */
  private static final Map<String, String> CONSTRAINT_MESSAGES =
      Map.of(
          "uq_pr_review_pr_url", "This PR is already being tracked",
          "uq_reviewer_email", "A reviewer with this email already exists",
          "uq_reviewer_handle", "A reviewer with this handle already exists",
          "uq_reviewer_component", "Reviewer already has this component");

  @ExceptionHandler(NotFoundException.class)
  ProblemDetail notFound(NotFoundException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  @ExceptionHandler(IllegalArgumentException.class)
  ProblemDetail badRequest(IllegalArgumentException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
  ProblemDetail staleUpdate(ObjectOptimisticLockingFailureException ex) {
    return ProblemDetail.forStatusAndDetail(
        HttpStatus.CONFLICT, "Record was modified by someone else. Reload and try again.");
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integrityViolation(DataIntegrityViolationException ex) {
    String constraint =
        ex.getCause() instanceof ConstraintViolationException cve ? cve.getConstraintName() : null;
    String detail =
        constraint == null
            ? "Request conflicts with existing data"
            : CONSTRAINT_MESSAGES.getOrDefault(constraint, "Constraint violated: " + constraint);
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, detail);
  }
}
