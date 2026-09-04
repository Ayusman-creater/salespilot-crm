import { apiSlice } from "../api/apiSlice";

export const timelineApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTimeline: builder.query({
      query: ({ kind, id }) => `/timeline/${kind}/${id}`,
      providesTags: (result, error, { id }) => [{ type: "Timeline", id }],
    }),
  }),
});

export const { useGetTimelineQuery } = timelineApi;
