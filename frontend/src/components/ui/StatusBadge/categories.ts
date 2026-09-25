import type { PrStatus } from "../../../types";

type Category = "neutral" | "info" | "warning" | "success" | "danger";

const CATEGORY_BY_STATUS: Record<PrStatus, Category> = {
  READY_FOR_REVIEW: "neutral",
  REVIEW_IN_PROGRESS: "info",
  COMMENTS_ADDED: "warning",
  COMMENTS_ADDRESSED: "info",
  APPROVED: "success",
  MERGED: "success",
  BLOCKED: "danger",
  BOT_REVIEW_COMPLETED: "success",
  READY_FOR_PLATFORM_REVIEW: "warning",
  BOT_REVIEW_REJECTED: "danger",
  CLOSED: "neutral",
};

export const STATUS_CATEGORY = CATEGORY_BY_STATUS;
export type { Category as StatusCategory };
