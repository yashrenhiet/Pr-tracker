export interface PrIdentity {
  /** `owner/repo`, or the raw URL if it isn't a recognisable GitHub PR link. */
  repo: string;
  /** `#123`, or `null` when the URL couldn't be parsed. */
  number: string | null;
}

const GITHUB_PR = /^https?:\/\/[^/]+\/([^/]+\/[^/]+)\/pull\/(\d+)/;

/**
 * How a PR is named to a human. The drawer used to title itself with the database id ("PR #6") while
 * the actual PR was #1 — this is the one place that decides what a PR is called.
 */
export function prIdentity(url: string): PrIdentity {
  const match = GITHUB_PR.exec(url);
  return match ? { repo: match[1], number: `#${match[2]}` } : { repo: url, number: null };
}

export function prLabel(url: string): string {
  const { repo, number } = prIdentity(url);
  return number ? `${repo} ${number}` : repo;
}
