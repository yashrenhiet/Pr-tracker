package io.prtracker.common;

/** Thrown when a requested entity does not exist. Mapped to HTTP 404. */
public class NotFoundException extends RuntimeException {

  public NotFoundException(String entity, Object id) {
    super(entity + " " + id + " not found");
  }
}
