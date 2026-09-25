package io.prtracker;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

/** Verifies Flyway applied V1__init.sql and its constraints behave as intended. */
class SchemaMigrationTest extends PostgresTestBase {

  @Autowired JdbcTemplate jdbc;

  @BeforeEach
  void clean() {
    jdbc.execute("TRUNCATE pr_review, reviewer RESTART IDENTITY CASCADE");
  }

  @Test
  void flywayCreatesAllTables() {
    var tables =
        jdbc.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            String.class);

    assertThat(tables).contains("pr_review", "reviewer", "reviewer_component");
  }

  @Test
  void rejectsUnknownStatus() {
    var insert =
        "INSERT INTO pr_review (pr_url, component, raised_by, status) VALUES (?, ?, ?, ?)";

    assertThatThrownBy(
            () -> jdbc.update(insert, "https://github.com/o/r/pull/1", "c", "me", "NOPE"))
        .hasMessageContaining("ck_pr_review_status");
  }

  @Test
  void enforcesCaseInsensitiveReviewerHandle() {
    var insert = "INSERT INTO reviewer (name, email, handle) VALUES (?, ?, ?)";
    jdbc.update(insert, "Ann", "ann@example.com", "Ann");

    assertThatThrownBy(() -> jdbc.update(insert, "Ann 2", "ann2@example.com", "ann"))
        .hasMessageContaining("uq_reviewer_handle");
  }
}
