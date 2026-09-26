import { Sparkles } from "lucide-react";
import { useGetAiReviewConfigQuery, useGetAiReviewStatusQuery, useTriggerAiReviewMutation } from "../../store/api";
import { problemDetail } from "../../api/problemDetail";
import { Button, useToast } from "../../components/ui";
import { formatDateTime, formatRelative } from "../../utils/formatDate";
import type { AiReviewRunResponse, ReviewResponse } from "../../types";
import styles from "./ReviewDetail.module.css";
import aiStyles from "./AiReviewSection.module.css";

const VERDICT_LABEL: Record<string, string> = {
  APPROVE: "Approved",
  REQUEST_CHANGES: "Requested changes",
  COMMENT: "Commented",
};

function summaryToastText(run: AiReviewRunResponse): string {
  if (run.status === "FAILED") {
    return run.error ?? "AI review failed.";
  }
  return run.dryRun
    ? `AI review complete (dry run) — ${run.commentsPosted} comment(s) generated.`
    : `AI review complete — ${run.commentsPosted} comment(s) posted to GitHub.`;
}

function RunSummary({ run }: { run: AiReviewRunResponse }) {
  if (run.status === "RUNNING") {
    return <p className={aiStyles.running}>Reviewing…</p>;
  }
  if (run.status === "FAILED") {
    return (
      <p role="alert" className={styles.errorBanner}>
        {run.error ?? "The AI review failed."}
      </p>
    );
  }
  return (
    <div className={aiStyles.result}>
      <div className={aiStyles.resultHeader}>
        <span className={aiStyles.verdict} data-verdict={run.verdict ?? undefined}>
          {run.verdict ? (VERDICT_LABEL[run.verdict] ?? run.verdict) : "No verdict"}
        </span>
        <span className={aiStyles.commentCount}>
          {run.dryRun
            ? `${run.commentsPosted} comment(s) generated (not posted)`
            : `${run.commentsPosted} comment(s) posted`}
        </span>
      </div>
      {run.summary && <p className={aiStyles.summary}>{run.summary}</p>}
      <p className={aiStyles.provenance}>
        {run.provider} · {run.model}
      </p>
    </div>
  );
}

/**
 * Renders nothing when the server hasn't configured the AI review feature — a half-working button
 * that always 503s is worse than no button. See `AiReviewConfigController` on the backend.
 */
export function AiReviewSection({ review }: { review: ReviewResponse }) {
  const { notify } = useToast();
  const { data: config } = useGetAiReviewConfigQuery();
  const {
    data: run,
    error: statusError,
    isFetching,
  } = useGetAiReviewStatusQuery(review.id, { skip: !config?.enabled });
  const [trigger, { isLoading: isTriggering }] = useTriggerAiReviewMutation();

  if (!config?.enabled) {
    return null;
  }

  const noRunsYet = !run && !isFetching && (statusError as { status?: number } | undefined)?.status === 404;
  const busy = isTriggering || run?.status === "RUNNING";

  async function handleTrigger() {
    try {
      const result = await trigger(review.id).unwrap();
      notify(result.status === "SUCCEEDED" ? "success" : "error", summaryToastText(result));
    } catch (err) {
      notify("error", problemDetail(err) ?? "AI review couldn't be started.");
    }
  }

  return (
    <section className={styles.section} aria-labelledby="ai-review-heading">
      <div className={styles.sectionHeader}>
        <h3 id="ai-review-heading" className={styles.sectionTitle}>
          AI review
        </h3>
        {run?.completedAt && (
          <span className={styles.meta}>
            <time dateTime={run.completedAt} title={formatDateTime(run.completedAt)}>
              {formatRelative(run.completedAt)}
            </time>
          </span>
        )}
      </div>

      {config.dryRun && (
        <p className={aiStyles.dryRunNotice}>
          Dry run mode: reviews are generated but not posted to GitHub. Set{" "}
          <code>AI_REVIEW_DRY_RUN=false</code> to post them for real.
        </p>
      )}

      {noRunsYet && <p className={aiStyles.empty}>This PR hasn&apos;t been reviewed by the bot yet.</p>}

      {run && <RunSummary run={run} />}

      <Button type="button" variant="secondary" loading={isTriggering} disabled={busy} onClick={handleTrigger}>
        <Sparkles size={16} aria-hidden="true" /> {run ? "Run AI review again" : "Run AI review"}
      </Button>
    </section>
  );
}
