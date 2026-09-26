/** Wiring shared by the details form and the drawer's pinned footer that submits it. */

export const DETAILS_FORM_ID = "review-details-form";

/** RTK Query's `fixedCacheKey` lets the footer show the form's save progress without prop-drilling. */
export function detailsSaveKey(id: number): string {
  return `save-review-details-${id}`;
}
