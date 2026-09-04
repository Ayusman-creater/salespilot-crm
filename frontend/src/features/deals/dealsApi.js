import { apiSlice } from "../api/apiSlice";

export const dealsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDeals: builder.query({
      query: (params) => ({ url: "/deals", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: "Deal", id: _id })), { type: "Deal", id: "LIST" }]
          : [{ type: "Deal", id: "LIST" }],
    }),
    getDeal: builder.query({
      query: (id) => `/deals/${id}`,
      providesTags: (result, error, id) => [{ type: "Deal", id }],
    }),
    updateDeal: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/deals/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Deal", id }, { type: "Deal", id: "LIST" }, "Dashboard"],
    }),
    updateDealStage: builder.mutation({
      query: ({ id, stage }) => ({ url: `/deals/${id}/stage`, method: "PUT", body: { stage } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Deal", id }, { type: "Deal", id: "LIST" }, "Dashboard"],
    }),
  }),
});

export const {
  useGetDealsQuery,
  useGetDealQuery,
  useUpdateDealMutation,
  useUpdateDealStageMutation,
} = dealsApi;
