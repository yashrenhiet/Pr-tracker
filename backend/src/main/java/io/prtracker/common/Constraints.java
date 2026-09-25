package io.prtracker.common;

/** Validation rules shared across APIs, so every endpoint accepts the same component names. */
public final class Constraints {

  private Constraints() {}

  /** Component names appear in URL paths, so no slashes or whitespace. */
  public static final String COMPONENT_PATTERN = "[A-Za-z0-9][A-Za-z0-9._-]{0,99}";

  public static final String COMPONENT_MESSAGE =
      "must be 1-100 chars of letters, digits, '.', '_' or '-', starting with a letter or digit";
}
