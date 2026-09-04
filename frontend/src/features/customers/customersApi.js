import { apiSlice } from "../api/apiSlice";

export const customersApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: (params) => ({ url: "/customers", params }),
      providesTags: (result) =>
        result?.data
          ? [...result.data.map(({ _id }) => ({ type: "Customer", id: _id })), { type: "Customer", id: "LIST" }]
          : [{ type: "Customer", id: "LIST" }],
    }),
    getCustomer: builder.query({
      query: (id) => `/customers/${id}`,
      providesTags: (result, error, id) => [{ type: "Customer", id }],
    }),
    updateCustomer: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/customers/${id}`, method: "PUT", body }),
      invalidatesTags: (result, error, { id }) => [{ type: "Customer", id }, { type: "Customer", id: "LIST" }],
    }),
  }),
});

export const { useGetCustomersQuery, useGetCustomerQuery, useUpdateCustomerMutation } = customersApi;
