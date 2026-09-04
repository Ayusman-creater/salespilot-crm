import { apiSlice } from "../api/apiSlice";

export const leadsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeads: builder.query({
      query: (params) => ({ url: "/leads", params }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map(({ _id }) => ({ type: "Lead", id: _id })),
              { type: "Lead", id: "LIST" },
            ]
          : [{ type: "Lead", id: "LIST" }],
    }),
    getLead: builder.query({
      query: (id) => `/leads/${id}`,
      providesTags: (result, error, id) => [{ type: "Lead", id }],
    }),
    createLead: builder.mutation({
      query: (body) => ({ url: "/leads", method: "POST", body }),
      invalidatesTags: [{ type: "Lead", id: "LIST" }, "Dashboard"],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Lead", id }, { type: "Lead", id: "LIST" }, "Dashboard"],
    }),
    assignLead: builder.mutation({
      query: ({ id, assignedTo }) => ({ url: `/leads/${id}/assign`, method: "PUT", body: { assignedTo } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Lead", id }, { type: "Lead", id: "LIST" }],
    }),
    addLeadNote: builder.mutation({
      query: ({ id, text }) => ({ url: `/leads/${id}/notes`, method: "POST", body: { text } }),
      invalidatesTags: (result, error, { id }) => [{ type: "Lead", id }],
    }),
    convertLead: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/leads/${id}/convert`, method: "POST", body }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Lead", id },
        { type: "Lead", id: "LIST" },
        { type: "Customer", id: "LIST" },
        { type: "Deal", id: "LIST" },
        "Dashboard",
      ],
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useAssignLeadMutation,
  useAddLeadNoteMutation,
  useConvertLeadMutation,
} = leadsApi;
