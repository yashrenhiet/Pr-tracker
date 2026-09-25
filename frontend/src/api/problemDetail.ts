import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

/** Field-level validation failures, matching `GlobalExceptionHandler.FieldProblem` on the backend. */
export interface FieldProblem {
  field: string;
  message: string;
}

interface ProblemBody {
  detail?: string;
  errors?: FieldProblem[];
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

/** Human-readable summary of an RTK Query error, for a toast or banner. */
export function problemDetail(error: unknown): string | undefined {
  if (!error) {
    return undefined;
  }
  if (!isFetchBaseQueryError(error)) {
    return (error as SerializedError).message ?? "Something went wrong";
  }
  const body = error.data as ProblemBody | undefined;
  if (body?.detail) {
    return body.detail;
  }
  return typeof error.status === "number" ? `Request failed (HTTP ${error.status})` : "Network error";
}

/** The message for one field, if the server flagged it — for showing next to a form input. */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!isFetchBaseQueryError(error)) {
    return undefined;
  }
  const body = error.data as ProblemBody | undefined;
  return body?.errors?.find((e) => e.field === field)?.message;
}
