package io.prtracker.common;

import java.util.List;
import java.util.function.Function;
import org.springframework.data.domain.Page;

/**
 * Stable JSON envelope for paged results.
 *
 * <p>Serialising Spring's {@code PageImpl} directly is not a stable contract, so the API returns
 * this record instead.
 */
public record PageResponse<T>(
    List<T> content, int page, int size, long totalElements, int totalPages) {

  public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
    return new PageResponse<>(
        page.getContent().stream().map(mapper).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages());
  }
}
