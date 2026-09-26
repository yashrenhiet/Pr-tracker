import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { PR_STATUSES, type PrStatus, type ReviewFilter, type SortDirection, type SortField } from "../../types";

const PAGE_SIZE = 20;
const TEXT_DEBOUNCE_MS = 300;
const SORT_FIELDS: readonly SortField[] = ["updatedAt", "createdAt", "status", "raisedBy", "component"];
const TEXT_KEYS = ["component", "raisedBy", "reviewer"] as const;
/** Not a filter, but lives in the same query string: the review whose drawer is open. */
const SELECTED_KEY = "review";

function parseStatuses(raw: string | null): PrStatus[] | undefined {
  const valid = (raw ?? "").split(",").filter((s): s is PrStatus => (PR_STATUSES as readonly string[]).includes(s));
  return valid.length > 0 ? valid : undefined;
}

function parseFilter(params: URLSearchParams): ReviewFilter {
  const sort = params.get("sort");
  const direction = params.get("direction");
  // The URL page is 1-based for humans (`?page=2` is the second page); the API is 0-based.
  const page = Math.max(Number.parseInt(params.get("page") ?? "1", 10) || 1, 1) - 1;
  return {
    component: params.get("component") || undefined,
    raisedBy: params.get("raisedBy") || undefined,
    reviewer: params.get("reviewer") || undefined,
    status: parseStatuses(params.get("status")),
    sort: SORT_FIELDS.includes(sort as SortField) ? (sort as SortField) : "updatedAt",
    direction: direction === "ASC" ? "ASC" : ("DESC" as SortDirection),
    page,
    size: PAGE_SIZE,
  };
}

function writeFilter(filter: ReviewFilter, selected: string | null): URLSearchParams {
  const next = new URLSearchParams();
  for (const key of TEXT_KEYS) {
    if (filter[key]) next.set(key, filter[key]);
  }
  if (filter.status?.length) next.set("status", filter.status.join(","));
  if (filter.sort && filter.sort !== "updatedAt") next.set("sort", filter.sort);
  if (filter.direction === "ASC") next.set("direction", "ASC");
  if (filter.page) next.set("page", String(filter.page + 1));
  if (selected) next.set(SELECTED_KEY, selected);
  return next;
}

export interface ReviewFilterState {
  /** What the controls show — updates on every keystroke. */
  filter: ReviewFilter;
  /** What goes to the API — text fields debounced so typing doesn't fire a request per key. */
  queryFilter: ReviewFilter;
  hasActiveFilters: boolean;
  patchFilter: (patch: Partial<ReviewFilter>) => void;
  clearFilters: () => void;
  /** Id of the review open in the drawer, from `?review=` — so a specific PR can be linked to. */
  selectedId: number | null;
  selectReview: (id: number | null) => void;
}

/**
 * The dashboard's filters live in the URL, not component state: a filtered view can be bookmarked,
 * shared with a teammate, and survives a reload. `replace` keeps typing from spamming history.
 */
export function useReviewFilterParams(): ReviewFilterState {
  const [params, setParams] = useSearchParams();
  const filter = useMemo(() => parseFilter(params), [params]);

  const component = useDebouncedValue(filter.component, TEXT_DEBOUNCE_MS);
  const raisedBy = useDebouncedValue(filter.raisedBy, TEXT_DEBOUNCE_MS);
  const reviewer = useDebouncedValue(filter.reviewer, TEXT_DEBOUNCE_MS);
  const queryFilter = useMemo(
    () => ({ ...filter, component, raisedBy, reviewer }),
    [filter, component, raisedBy, reviewer],
  );

  const patchFilter = useCallback(
    (patch: Partial<ReviewFilter>) =>
      setParams((prev) => writeFilter({ ...parseFilter(prev), ...patch }, prev.get(SELECTED_KEY)), { replace: true }),
    [setParams],
  );
  const clearFilters = useCallback(
    () => setParams((prev) => writeFilter(parseFilter(new URLSearchParams()), prev.get(SELECTED_KEY)), { replace: true }),
    [setParams],
  );
  // Opening a PR is a real navigation (Back closes it); closing replaces, so Back doesn't reopen it.
  const selectReview = useCallback(
    (id: number | null) =>
      setParams((prev) => writeFilter(parseFilter(prev), id === null ? null : String(id)), { replace: id === null }),
    [setParams],
  );

  const selectedRaw = Number.parseInt(params.get(SELECTED_KEY) ?? "", 10);
  const selectedId = Number.isInteger(selectedRaw) && selectedRaw > 0 ? selectedRaw : null;
  const hasActiveFilters = Boolean(filter.component || filter.raisedBy || filter.reviewer || filter.status?.length);

  return { filter, queryFilter, hasActiveFilters, patchFilter, clearFilters, selectedId, selectReview };
}
