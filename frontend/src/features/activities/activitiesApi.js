import { apiSlice } from "../api/apiSlice";

export const activitiesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query({
      query: (params) => ({ url: "/activities", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: "Activity", id: _id })), { type: "Activity", id: "LIST" }]
          : [{ type: "Activity", id: "LIST" }],
    }),
    createActivity: builder.mutation({
      query: (body) => ({ url: "/activities", method: "POST", body }),
      invalidatesTags: [{ type: "Activity", id: "LIST" }, "Dashboard"],
    }),
    updateActivity: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/activities/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Activity", id },
        { type: "Activity", id: "LIST" },
        "Dashboard",
      ],
    }),
    deleteActivity: builder.mutation({
      query: (id) => ({ url: `/activities/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Activity", id: "LIST" }, "Dashboard"],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useCreateActivityMutation,
  useUpdateActivityMutation,
  useDeleteActivityMutation,
} = activitiesApi;
