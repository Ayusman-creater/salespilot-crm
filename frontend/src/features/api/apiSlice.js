import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  credentials: "include", // send httpOnly cookie with every request
});

// Central API slice — all feature endpoints are injected into this via injectEndpoints
// so we get one shared cache, consistent tag invalidation, and one place to configure
// base behavior (auth headers, error handling, base URL).
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Lead", "Customer", "Deal", "Activity", "Dashboard", "Timeline", "Notification", "User"],
  endpoints: () => ({}),
});
