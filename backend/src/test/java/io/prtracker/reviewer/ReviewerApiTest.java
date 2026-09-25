package io.prtracker.reviewer;

import static org.assertj.core.api.Assertions.assertThat;

import io.prtracker.PostgresTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/** End-to-end tests for /api/reviewers and /api/components against a real PostgreSQL. */
@AutoConfigureMockMvc
class ReviewerApiTest extends PostgresTestBase {

  @Autowired MockMvcTester mvc;
  @Autowired JdbcTemplate jdbc;

  @BeforeEach
  void clean() {
    jdbc.execute("TRUNCATE pr_review, reviewer RESTART IDENTITY CASCADE");
  }

  @Test
  void createAndList() {
    assertThat(createReviewer("Ann", "ann@example.com", "ann")).hasStatus(HttpStatus.CREATED);

    assertThat(mvc.get().uri("/api/reviewers"))
        .bodyJson().extractingPath("$[0].handle").isEqualTo("ann");
  }

  @Test
  void duplicateEmailOrHandleIsConflictIgnoringCase() {
    createReviewer("Ann", "ann@example.com", "ann");

    assertThat(createReviewer("X", "ANN@example.com", "other"))
        .hasStatus(HttpStatus.CONFLICT)
        .bodyJson().extractingPath("$.detail").isEqualTo("A reviewer with this email already exists");
    assertThat(createReviewer("X", "x@example.com", "ANN"))
        .hasStatus(HttpStatus.CONFLICT)
        .bodyJson().extractingPath("$.detail").isEqualTo("A reviewer with this handle already exists");
  }

  @Test
  void rejectsInvalidEmailAndHandle() {
    assertThat(createReviewer("Ann", "not-an-email", "ann"))
        .hasStatus(HttpStatus.BAD_REQUEST)
        .bodyJson().extractingPath("$.errors[0].field").isEqualTo("email");
    assertThat(createReviewer("Ann", "ann@example.com", "has space"))
        .hasStatus(HttpStatus.BAD_REQUEST)
        .bodyJson().extractingPath("$.errors[0].field").isEqualTo("handle");
  }

  @Test
  void grantAndRevokeAreIdempotentAndCaseInsensitive() {
    createReviewer("Ann", "ann@example.com", "ann");

    assertThat(mvc.put().uri("/api/reviewers/1/components/api")).hasStatusOk();
    var again = mvc.put().uri("/api/reviewers/1/components/API").exchange();
    assertThat(again).bodyJson().extractingPath("$.components").asArray().containsExactly("api");

    assertThat(mvc.delete().uri("/api/reviewers/1/components/Api"))
        .bodyJson().extractingPath("$.components").asArray().isEmpty();
    assertThat(mvc.delete().uri("/api/reviewers/1/components/api")).hasStatusOk();
  }

  @Test
  void grantRejectsInvalidComponentName() {
    createReviewer("Ann", "ann@example.com", "ann");

    assertThat(mvc.put().uri("/api/reviewers/1/components/-bad"))
        .hasStatus(HttpStatus.BAD_REQUEST)
        .bodyJson().extractingPath("$.errors[0].field").isEqualTo("component");
  }

  @Test
  void deleteCascadesGrants() {
    createReviewer("Ann", "ann@example.com", "ann");
    mvc.put().uri("/api/reviewers/1/components/api").exchange();

    assertThat(mvc.delete().uri("/api/reviewers/1")).hasStatus(HttpStatus.NO_CONTENT);
    assertThat(jdbc.queryForObject("SELECT count(*) FROM reviewer_component", Integer.class)).isZero();
    assertThat(mvc.delete().uri("/api/reviewers/1")).hasStatus(HttpStatus.NOT_FOUND);
  }

  @Test
  void componentsMergesReviewsAndGrantsIgnoringCase() {
    createReviewer("Ann", "ann@example.com", "ann");
    mvc.put().uri("/api/reviewers/1/components/web").exchange();
    mvc.put().uri("/api/reviewers/1/components/API").exchange();
    mvc.post()
        .uri("/api/reviews")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"prUrl\":\"https://github.com/a/b/pull/1\",\"component\":\"api\",\"raisedBy\":\"x\"}")
        .exchange();

    assertThat(mvc.get().uri("/api/components"))
        .bodyJson().extractingPath("$").asArray().containsExactly("API", "web");
  }

  private MvcTestResult createReviewer(String name, String email, String handle) {
    return mvc.post()
        .uri("/api/reviewers")
        .contentType(MediaType.APPLICATION_JSON)
        .content("{\"name\":\"%s\",\"email\":\"%s\",\"handle\":\"%s\"}".formatted(name, email, handle))
        .exchange();
  }
}
