import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { toQuery } from "../api/queryString";
import type {
  ChangeStatus,
  CreateReview,
  CreateReviewer,
  PageResponse,
  ReviewFilter,
  ReviewResponse,
  ReviewerResponse,
  UpdateReview,
} from "../types";

const LIST = "LIST" as const;

/**
 * Writes a mutation's returned review straight into the `getReview` cache, so the open drawer sees the
 * new `version` the instant the server answers. Waiting for the tag-driven refetch left a window where
 * "update status, then save details" sent the stale version and got a 409.
 */
async function syncReviewCache(
  queryFulfilled: Promise<{ data: ReviewResponse }>,
  dispatch: (action: unknown) => unknown,
): Promise<void> {
  try {
    const { data } = await queryFulfilled;
    dispatch(api.util.upsertQueryData("getReview", data.id, data));
  } catch {
    // The failure surfaces through the mutation hook's `error`; nothing to sync.
  }
}

/**
 * The one API slice for the whole app. RTK Query owns loading/error state and the cache, so
 * components just call the generated hooks — no hand-rolled thunks or reducers needed.
 */
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: ["Review", "Reviewer", "Component"],
  endpoints: (builder) => ({
    listReviews: builder.query<PageResponse<ReviewResponse>, ReviewFilter>({
      query: (filter) => `/reviews${toQuery(filter)}`,
      providesTags: (result) => [
        ...(result?.content.map((r) => ({ type: "Review" as const, id: r.id })) ?? []),
        { type: "Review", id: LIST },
      ],
    }),
    getReview: builder.query<ReviewResponse, number>({
      query: (id) => `/reviews/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Review", id }],
    }),
    createReview: builder.mutation<ReviewResponse, CreateReview>({
      query: (body) => ({ url: "/reviews", method: "POST", body }),
      invalidatesTags: [
        { type: "Review", id: LIST },
        { type: "Component", id: LIST },
      ],
    }),
    updateReview: builder.mutation<ReviewResponse, { id: number; body: UpdateReview }>({
      query: ({ id, body }) => ({ url: `/reviews/${id}`, method: "PATCH", body }),
      onQueryStarted: (_arg, { queryFulfilled, dispatch }) => syncReviewCache(queryFulfilled, dispatch),
      invalidatesTags: [{ type: "Review", id: LIST }],
    }),
    changeReviewStatus: builder.mutation<ReviewResponse, { id: number; body: ChangeStatus }>({
      query: ({ id, body }) => ({ url: `/reviews/${id}/status`, method: "PUT", body }),
      onQueryStarted: (_arg, { queryFulfilled, dispatch }) => syncReviewCache(queryFulfilled, dispatch),
      invalidatesTags: [{ type: "Review", id: LIST }],
    }),
    deleteReview: builder.mutation<void, number>({
      query: (id) => ({ url: `/reviews/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Review", id: LIST }],
    }),

    listReviewers: builder.query<ReviewerResponse[], void>({
      query: () => "/reviewers",
      providesTags: (result) => [
        ...(result?.map((r) => ({ type: "Reviewer" as const, id: r.id })) ?? []),
        { type: "Reviewer", id: LIST },
      ],
    }),
    createReviewer: builder.mutation<ReviewerResponse, CreateReviewer>({
      query: (body) => ({ url: "/reviewers", method: "POST", body }),
      invalidatesTags: [{ type: "Reviewer", id: LIST }],
    }),
    deleteReviewer: builder.mutation<void, number>({
      query: (id) => ({ url: `/reviewers/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Reviewer", id: LIST }],
    }),
    grantComponent: builder.mutation<ReviewerResponse, { id: number; component: string }>({
      query: ({ id, component }) => ({
        url: `/reviewers/${id}/components/${encodeURIComponent(component)}`,
        method: "PUT",
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Reviewer", id },
        { type: "Component", id: LIST },
      ],
    }),
    revokeComponent: builder.mutation<ReviewerResponse, { id: number; component: string }>({
      query: ({ id, component }) => ({
        url: `/reviewers/${id}/components/${encodeURIComponent(component)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Reviewer", id }],
    }),

    listComponents: builder.query<string[], void>({
      query: () => "/components",
      providesTags: [{ type: "Component", id: LIST }],
    }),
  }),
});

export const {
  useListReviewsQuery,
  useGetReviewQuery,
  useCreateReviewMutation,
  useUpdateReviewMutation,
  useChangeReviewStatusMutation,
  useDeleteReviewMutation,
  useListReviewersQuery,
  useCreateReviewerMutation,
  useDeleteReviewerMutation,
  useGrantComponentMutation,
  useRevokeComponentMutation,
  useListComponentsQuery,
} = api;
