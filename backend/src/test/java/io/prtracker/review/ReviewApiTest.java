package io.prtracker.review;

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

/** End-to-end tests for /api/reviews against a real PostgreSQL. */
@AutoConfigureMockMvc
class ReviewApiTest extends PostgresTestBase {

  @Autowired MockMvcTester mvc;
  @Autowired JdbcTemplate jdbc;

  @BeforeEach
  void clean() {
    jdbc.execute("TRUNCATE pr_review, reviewer RESTART IDENTITY CASCADE");
  }

  @Test
  void createCanonicalisesUrlAndNormalisesLists() {
    var result =
        post(
            "/api/reviews",
            """
            {"prUrl":"https://github.com/acme/api/pull/7/files","component":"api",
             "raisedBy":" ann ","internalReviewers":["bob"," BOB ",""],
             "metadata":{"ticket":"ABC-1","blank":" "}}
            """);

    assertThat(result).hasStatus(HttpStatus.CREATED).hasHeader("Location", "/api/reviews/1");
    assertThat(result).bodyJson().extractingPath("$.prUrl").isEqualTo("https://github.com/acme/api/pull/7");
    assertThat(result).bodyJson().extractingPath("$.raisedBy").isEqualTo("ann");
    assertThat(result).bodyJson().extractingPath("$.status").isEqualTo("READY_FOR_REVIEW");
    assertThat(result).bodyJson().extractingPath("$.internalReviewers").asArray().containsExactly("bob");
    assertThat(result).bodyJson().extractingPath("$.metadata.ticket").isEqualTo("ABC-1");
    assertThat(result).bodyJson().extractingPath("$.metadata.blank").isNull();
  }

  @Test
  void duplicatePrUrlIsConflictEvenWithDifferentSuffix() {
    createReview("https://github.com/acme/api/pull/7", "api");

    var result =
        post(
            "/api/reviews",
            """
            {"prUrl":"https://github.com/acme/api/pull/7?x=1","component":"api","raisedBy":"ann"}
            """);

    assertThat(result).hasStatus(HttpStatus.CONFLICT);
    assertThat(result).bodyJson().extractingPath("$.detail").isEqualTo("This PR is already being tracked");
  }

  @Test
  void rejectsInvalidInput() {
    assertThat(post("/api/reviews", "{\"prUrl\":\"not a url\",\"component\":\"api\",\"raisedBy\":\"a\"}"))
        .hasStatus(HttpStatus.BAD_REQUEST);
    assertThat(post("/api/reviews", "{\"prUrl\":\"https://github.com/a/b/pull/1\",\"component\":\"bad name\",\"raisedBy\":\"a\"}"))
        .hasStatus(HttpStatus.BAD_REQUEST);
    assertThat(post("/api/reviews", "{\"component\":\"api\"}")).hasStatus(HttpStatus.BAD_REQUEST);
  }

  @Test
  void patchUpdatesOnlySentFieldsAndBlankContextClears() {
    createReview("https://github.com/acme/api/pull/1", "api");
    patch("/api/reviews/1", "{\"context\":\"initial\"}");

    var result = patch("/api/reviews/1", "{\"context\":\"  \",\"platformReviewers\":[\"carol\"]}");

    assertThat(result).hasStatusOk();
    assertThat(result).bodyJson().extractingPath("$.context").isNull();
    assertThat(result).bodyJson().extractingPath("$.platformReviewers").asArray().containsExactly("carol");
    assertThat(result).bodyJson().extractingPath("$.component").isEqualTo("api");
  }

  @Test
  void patchWithStaleVersionIsConflict() {
    createReview("https://github.com/acme/api/pull/1", "api");
    patch("/api/reviews/1", "{\"context\":\"bumps version to 1\"}");

    assertThat(patch("/api/reviews/1", "{\"context\":\"stale\",\"version\":0}"))
        .hasStatus(HttpStatus.CONFLICT);
  }

  @Test
  void blockedStatusRequiresReason() {
    createReview("https://github.com/acme/api/pull/1", "api");

    assertThat(put("/api/reviews/1/status", "{\"status\":\"BLOCKED\"}"))
        .hasStatus(HttpStatus.BAD_REQUEST);

    var ok = put("/api/reviews/1/status", "{\"status\":\"BLOCKED\",\"blockReason\":\"conflicts\"}");
    assertThat(ok).hasStatusOk();
    assertThat(ok).bodyJson().extractingPath("$.blockReason").isEqualTo("conflicts");
    assertThat(ok).bodyJson().extractingPath("$.statusLabel").isEqualTo("Blocked");
  }

  @Test
  void unknownStatusIsBadRequest() {
    createReview("https://github.com/acme/api/pull/1", "api");

    assertThat(put("/api/reviews/1/status", "{\"status\":\"NOPE\"}")).hasStatus(HttpStatus.BAD_REQUEST);
  }

  @Test
  void listFiltersByStatusComponentAndReviewer() {
    createReview("https://github.com/acme/api/pull/1", "api");
    createReview("https://github.com/acme/web/pull/2", "web");
    createReview("https://github.com/acme/api/pull/3", "API");
    put("/api/reviews/3/status", "{\"status\":\"MERGED\"}");
    patch("/api/reviews/2", "{\"platformReviewers\":[\"carol\"]}");

    assertThat(mvc.get().uri("/api/reviews?component=api"))
        .bodyJson().extractingPath("$.totalElements").isEqualTo(2);
    assertThat(mvc.get().uri("/api/reviews?component=api&status=MERGED"))
        .bodyJson().extractingPath("$.content[0].id").isEqualTo(3);
    assertThat(mvc.get().uri("/api/reviews?status=MERGED,READY_FOR_REVIEW"))
        .bodyJson().extractingPath("$.totalElements").isEqualTo(3);
    assertThat(mvc.get().uri("/api/reviews?reviewer=carol"))
        .bodyJson().extractingPath("$.content[0].id").isEqualTo(2);
  }

  @Test
  void listPagesAndValidatesParams() {
    for (int i = 1; i <= 3; i++) {
      createReview("https://github.com/acme/api/pull/" + i, "api");
    }

    var page = mvc.get().uri("/api/reviews?size=2&page=1&sort=createdAt&direction=ASC").exchange();
    assertThat(page).bodyJson().extractingPath("$.content[0].id").isEqualTo(3);
    assertThat(page).bodyJson().extractingPath("$.totalPages").isEqualTo(2);

    assertThat(mvc.get().uri("/api/reviews?size=101")).hasStatus(HttpStatus.BAD_REQUEST);
    assertThat(mvc.get().uri("/api/reviews?sort=pr_url")).hasStatus(HttpStatus.BAD_REQUEST);
    assertThat(mvc.get().uri("/api/reviews?direction=sideways")).hasStatus(HttpStatus.BAD_REQUEST);
  }

  @Test
  void missingReviewIsNotFound() {
    assertThat(mvc.get().uri("/api/reviews/999")).hasStatus(HttpStatus.NOT_FOUND);
    assertThat(mvc.delete().uri("/api/reviews/999")).hasStatus(HttpStatus.NOT_FOUND);
  }

  @Test
  void deleteRemovesReview() {
    createReview("https://github.com/acme/api/pull/1", "api");

    assertThat(mvc.delete().uri("/api/reviews/1")).hasStatus(HttpStatus.NO_CONTENT);
    assertThat(mvc.get().uri("/api/reviews/1")).hasStatus(HttpStatus.NOT_FOUND);
  }

  private void createReview(String url, String component) {
    var body = "{\"prUrl\":\"%s\",\"component\":\"%s\",\"raisedBy\":\"ann\"}".formatted(url, component);
    assertThat(post("/api/reviews", body)).hasStatus(HttpStatus.CREATED);
  }

  private MvcTestResult post(String uri, String json) {
    return mvc.post().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json).exchange();
  }

  private MvcTestResult patch(String uri, String json) {
    return mvc.patch().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json).exchange();
  }

  private MvcTestResult put(String uri, String json) {
    return mvc.put().uri(uri).contentType(MediaType.APPLICATION_JSON).content(json).exchange();
  }
}
