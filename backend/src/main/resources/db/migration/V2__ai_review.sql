-- AI-assisted code review: one row per attempt to review a PR with an LLM.
--
-- Design notes:
--  * Kept as its own table rather than columns on pr_review: an AI review is one of
--    potentially many attempts against a PR (re-run after a fix, a scheduled retry), and this
--    table is the audit trail of every attempt, not just the latest one.
--  * The partial unique index below is the concurrency guard: Postgres itself refuses a second
--    RUNNING row for the same PR, so a scheduler tick racing a manual "run now" click (or two
--    overlapping ticks) fails on insert instead of silently reviewing the same PR twice.
CREATE TABLE ai_review_run (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pr_review_id       BIGINT      NOT NULL REFERENCES pr_review(id) ON DELETE CASCADE,
    status             TEXT        NOT NULL DEFAULT 'RUNNING',
    verdict            TEXT,
    summary            TEXT,
    comments_posted    INT         NOT NULL DEFAULT 0,
    comments_rejected  INT         NOT NULL DEFAULT 0,
    provider           TEXT        NOT NULL,
    model              TEXT        NOT NULL,
    dry_run            BOOLEAN     NOT NULL DEFAULT FALSE,
    error              TEXT,
    started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at       TIMESTAMPTZ,

    CONSTRAINT ck_ai_review_run_status  CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
    CONSTRAINT ck_ai_review_run_verdict CHECK (verdict IS NULL OR verdict IN ('APPROVE', 'REQUEST_CHANGES', 'COMMENT'))
);

CREATE INDEX ix_ai_review_run_pr_review_id ON ai_review_run (pr_review_id, started_at DESC);

-- At most one RUNNING run per PR at a time.
CREATE UNIQUE INDEX uq_ai_review_run_one_running
    ON ai_review_run (pr_review_id)
    WHERE status = 'RUNNING';
