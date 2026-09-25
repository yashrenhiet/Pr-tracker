package io.prtracker;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base for tests that need a real PostgreSQL.
 *
 * <p>One container is started per JVM (singleton pattern) and shared by all subclasses, and Spring
 * reuses the same context. Tests are skipped, not failed, when no container runtime is reachable.
 */
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
public abstract class PostgresTestBase {

  @ServiceConnection
  protected static final PostgreSQLContainer POSTGRES =
      new PostgreSQLContainer("docker.io/library/postgres:16-alpine");

  static {
    if (org.testcontainers.DockerClientFactory.instance().isDockerAvailable()) {
      POSTGRES.start();
    }
  }
}
