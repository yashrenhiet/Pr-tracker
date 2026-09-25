package io.prtracker;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.sql.DriverManager;
import java.sql.SQLException;
import org.junit.jupiter.api.BeforeAll;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base for tests that need a real PostgreSQL. The database comes from one of two places:
 *
 * <ol>
 *   <li><b>External</b>: when {@code TEST_DB_URL} is set (plus optional {@code TEST_DB_USERNAME} /
 *       {@code TEST_DB_PASSWORD}). Its {@code public} schema is <b>dropped and recreated</b> once
 *       per JVM so Flyway always starts clean. Point it at a throwaway database, never real data.
 *   <li><b>Testcontainers</b>: otherwise, if a container runtime is reachable. One container per
 *       JVM, shared by all subclasses.
 * </ol>
 *
 * <p>If neither is available, the tests are skipped, not failed.
 */
@SpringBootTest
public abstract class PostgresTestBase {

  private static final Database DB = Database.resolve();

  @BeforeAll
  static void requireDatabase() {
    assumeTrue(DB != null, "No PostgreSQL: set TEST_DB_URL or start a container runtime");
  }

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    if (DB == null) {
      return; // requireDatabase() skips the class before the context is ever loaded
    }
    registry.add("spring.datasource.url", DB::url);
    registry.add("spring.datasource.username", DB::username);
    registry.add("spring.datasource.password", DB::password);
  }

  private record Database(String url, String username, String password) {

    static Database resolve() {
      var url = System.getenv("TEST_DB_URL");
      if (url != null && !url.isBlank()) {
        var db = new Database(url, env("TEST_DB_USERNAME", "prtracker"), env("TEST_DB_PASSWORD", ""));
        db.resetSchema();
        return db;
      }
      if (DockerClientFactory.instance().isDockerAvailable()) {
        var container = new PostgreSQLContainer("docker.io/library/postgres:16-alpine");
        container.start();
        return new Database(container.getJdbcUrl(), container.getUsername(), container.getPassword());
      }
      return null;
    }

    private void resetSchema() {
      try (var conn = DriverManager.getConnection(url, username, password);
          var stmt = conn.createStatement()) {
        stmt.execute("DROP SCHEMA IF EXISTS public CASCADE");
        stmt.execute("CREATE SCHEMA public");
      } catch (SQLException e) {
        throw new IllegalStateException("Cannot reset schema of TEST_DB_URL=" + url, e);
      }
    }

    private static String env(String name, String fallback) {
      var value = System.getenv(name);
      return value == null ? fallback : value;
    }
  }
}
