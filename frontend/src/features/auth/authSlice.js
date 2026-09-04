import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null, // { id, name, email, role, manager }
  isInitializing: true, // true until we've checked /auth/me on app load
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isInitializing = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isInitializing = false;
    },
    finishInitializing: (state) => {
      state.isInitializing = false;
    },
  },
});

export const { setCredentials, clearCredentials, finishInitializing } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsInitializing = (state) => state.auth.isInitializing;
