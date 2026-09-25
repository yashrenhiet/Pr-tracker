-- Initial schema for PR Tracker (PostgreSQL 14+).
--
-- Design notes:
--  * Status is stored as readable text guarded by a CHECK, instead of magic integers.
--  * Reviewer lists are text[] instead of comma-separated strings, so they can be
--    queried with `= ANY(...)` without string splitting.
--  * Optional, tracker-specific fields (ticket id, labels, ...) go in `metadata`
--    jsonb, so the core schema stays generic.

CREATE TABLE pr_review (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pr_url              TEXT        NOT NULL,
    component           TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'READY_FOR_REVIEW',
    context             TEXT,
    raised_by           TEXT        NOT NULL,
    internal_reviewers  TEXT[]      NOT NULL DEFAULT '{}',
    platform_reviewers  TEXT[]      NOT NULL DEFAULT '{}',
    block_reason        TEXT,
    metadata            JSONB       NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    version             BIGINT      NOT NULL DEFAULT 0,

    CONSTRAINT uq_pr_review_pr_url UNIQUE (pr_url),
    CONSTRAINT ck_pr_review_status CHECK (status IN (
        'READY_FOR_REVIEW',
        'REVIEW_IN_PROGRESS',
        'COMMENTS_ADDED',
        'COMMENTS_ADDRESSED',
        'APPROVED',
        'MERGED',
        'BLOCKED',
        'BOT_REVIEW_COMPLETED',
        'READY_FOR_PLATFORM_REVIEW',
        'BOT_REVIEW_REJECTED',
        'CLOSED'
    )),
    CONSTRAINT ck_pr_review_pr_url CHECK (pr_url ~ '^https?://[^/]+/[^/]+/[^/]+/pull/[0-9]+$')
);

CREATE INDEX ix_pr_review_status     ON pr_review (status);
CREATE INDEX ix_pr_review_created_at ON pr_review (created_at DESC);
CREATE INDEX ix_pr_review_component  ON pr_review (lower(component));

-- People allowed to act as platform reviewers, scoped to components.
CREATE TABLE reviewer (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT        NOT NULL,
    email       TEXT        NOT NULL,
    handle      TEXT        NOT NULL,  -- e.g. GitHub username
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    version     BIGINT      NOT NULL DEFAULT 0
);

-- Case-insensitive uniqueness (the old MSSQL collation did this implicitly).
CREATE UNIQUE INDEX uq_reviewer_email  ON reviewer (lower(email));
CREATE UNIQUE INDEX uq_reviewer_handle ON reviewer (lower(handle));

CREATE TABLE reviewer_component (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    reviewer_id  BIGINT NOT NULL REFERENCES reviewer (id) ON DELETE CASCADE,
    component    TEXT   NOT NULL
);

CREATE UNIQUE INDEX uq_reviewer_component ON reviewer_component (reviewer_id, lower(component));
