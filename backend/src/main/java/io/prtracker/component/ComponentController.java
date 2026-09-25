package io.prtracker.component;

import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * {@code GET /api/components}: every component name known to the system, from both PRs and
 * reviewer grants, deduplicated case-insensitively and sorted.
 *
 * <p>Derived with one query instead of a separate registry table, so it can never drift out of sync
 * with the data it describes.
 */
@RestController
@RequestMapping("/api/components")
public class ComponentController {

  private static final String SQL =
      """
      SELECT min(component) AS component
      FROM (SELECT component FROM pr_review
            UNION ALL
            SELECT component FROM reviewer_component) c
      GROUP BY lower(component)
      ORDER BY lower(min(component))
      """;

  private final JdbcClient jdbc;

  ComponentController(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping
  @Transactional(readOnly = true)
  public List<String> list() {
    return jdbc.sql(SQL).query(String.class).list();
  }
}
