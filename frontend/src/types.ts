/**
 * Shapes mirroring the backend DTOs in `io.prtracker.review.ReviewDtos` and
 * `io.prtracker.reviewer.ReviewerDtos`. Keep these in sync with the Java records by hand — there's
 * no shared schema between the two languages (yet).
 */

export const PR_STATUSES = [
  "READY_FOR_REVIEW",
  "REVIEW_IN_PROGRESS",
  "COMMENTS_ADDED",
  "COMMENTS_ADDRESSED",
  "APPROVED",
  "MERGED",
  "BLOCKED",
  "BOT_REVIEW_COMPLETED",
  "READY_FOR_PLATFORM_REVIEW",
  "BOT_REVIEW_REJECTED",
  "CLOSED",
] as const;

export type PrStatus = (typeof PR_STATUSES)[number];

/** Human labels, kept in lockstep with `PrStatus.label()` on the backend. */
export const STATUS_LABELS: Record<PrStatus, string> = {
  READY_FOR_REVIEW: "Ready for review",
  REVIEW_IN_PROGRESS: "Review in progress",
  COMMENTS_ADDED: "Comments added",
  COMMENTS_ADDRESSED: "Comments addressed",
  APPROVED: "Approved",
  MERGED: "Merged",
  BLOCKED: "Blocked",
  BOT_REVIEW_COMPLETED: "Bot review completed",
  READY_FOR_PLATFORM_REVIEW: "Ready for platform review",
  BOT_REVIEW_REJECTED: "Bot review rejected",
  CLOSED: "Closed",
};

export interface ReviewResponse {
  id: number;
  prUrl: string;
  component: string;
  status: PrStatus;
  statusLabel: string;
  context: string | null;
  raisedBy: string;
  internalReviewers: string[];
  platformReviewers: string[];
  blockReason: string | null;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface CreateReview {
  prUrl: string;
  component: string;
  raisedBy: string;
  context?: string;
  internalReviewers?: string[];
  platformReviewers?: string[];
  metadata?: Record<string, string>;
}

/** Partial update: an omitted field means "leave unchanged". */
export interface UpdateReview {
  prUrl?: string;
  component?: string;
  raisedBy?: string;
  context?: string;
  internalReviewers?: string[];
  platformReviewers?: string[];
  metadata?: Record<string, string>;
  version?: number;
}

export interface ChangeStatus {
  status: PrStatus;
  blockReason?: string;
}

export interface ReviewerResponse {
  id: number;
  name: string;
  email: string;
  handle: string;
  components: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewer {
  name: string;
  email: string;
  handle: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type SortField = "createdAt" | "updatedAt" | "status" | "raisedBy" | "component";
export type SortDirection = "ASC" | "DESC";

/** Mirrors `io.prtracker.aireview.AiReviewDtos` on the backend. */
export type AiReviewRunStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type AiReviewVerdict = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";

export interface AiReviewRunResponse {
  id: number;
  reviewId: number;
  status: AiReviewRunStatus;
  verdict: AiReviewVerdict | null;
  summary: string | null;
  commentsPosted: number;
  commentsRejected: number;
  provider: string;
  model: string;
  dryRun: boolean;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
}

/** Whether the AI review feature is usable on this server. Never carries the API key or GitHub token. */
export interface AiReviewConfigResponse {
  enabled: boolean;
  provider: string;
  model: string;
  dryRun: boolean;
  githubConfigured: boolean;
}

/** Query params for `GET /reviews`. All optional; omitted means "no filter". */
export interface ReviewFilter {
  status?: PrStatus[];
  raisedBy?: string;
  reviewer?: string;
  component?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  size?: number;
  sort?: SortField;
  direction?: SortDirection;
}
