package io.prtracker.common;

import io.prtracker.aireview.AiReviewAlreadyRunningException;
import io.prtracker.aireview.AiReviewNotConfiguredException;
import java.util.List;
import java.util.Map;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Maps domain and persistence exceptions to RFC 9457 problem responses.
 *
 * <p>Malformed-request errors are handled by the {@link ResponseEntityExceptionHandler} base
 * class. Validation errors are overridden so the client learns <em>which</em> field failed: the
 * body gets an {@code errors} array of {@code {field, message}}.
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

  @ExceptionHandler(AiReviewNotConfiguredException.class)
  ProblemDetail aiReviewNotConfigured(AiReviewNotConfiguredException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage());
  }

  @ExceptionHandler(AiReviewAlreadyRunningException.class)
  ProblemDetail aiReviewAlreadyRunning(AiReviewAlreadyRunningException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
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

  /** One failed validation rule. {@code field} is a body property or a path/query parameter. */
  public record FieldProblem(String field, String message) {}

  /** {@code @Valid @RequestBody} failures. */
  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    var errors =
        ex.getFieldErrors().stream()
            .map(e -> new FieldProblem(e.getField(), e.getDefaultMessage()))
            .toList();
    return validationProblem(ex.getBody(), errors, headers, status);
  }

  /** Constraint annotations on path variables and request params. */
  @Override
  protected ResponseEntity<Object> handleHandlerMethodValidationException(
      HandlerMethodValidationException ex,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    var errors =
        ex.getParameterValidationResults().stream()
            .flatMap(
                r -> {
                  String param = r.getMethodParameter().getParameterName();
                  return r.getResolvableErrors().stream()
                      .map(e -> new FieldProblem(param, e.getDefaultMessage()));
                })
            .toList();
    return validationProblem(ex.getBody(), errors, headers, status);
  }

  private static ResponseEntity<Object> validationProblem(
      ProblemDetail body, List<FieldProblem> errors, HttpHeaders headers, HttpStatusCode status) {
    body.setDetail("Validation failed");
    body.setProperty("errors", errors);
    return ResponseEntity.status(status).headers(headers).body(body);
  }
}
