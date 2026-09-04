import { createSlice } from "@reduxjs/toolkit";

const loadPersisted = () => {
  try {
    const token = localStorage.getItem("sp_token");
    const userRaw = localStorage.getItem("sp_user");
    return {
      token: token || null,
      user: userRaw ? JSON.parse(userRaw) : null,
    };
  } catch {
    return { token: null, user: null };
  }
};

const persisted = loadPersisted();

const initialState = {
  user: persisted.user,
  token: persisted.token,
  isInitializing: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const user = action.payload?.user ?? action.payload;
      const token = action.payload?.token;

      state.user = user;
      if (token) state.token = token;
      state.isInitializing = false;

      try {
        if (user) localStorage.setItem("sp_user", JSON.stringify(user));
        if (token) localStorage.setItem("sp_token", token);
      } catch {
        // ignore storage errors
      }
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isInitializing = false;
      try {
        localStorage.removeItem("sp_user");
        localStorage.removeItem("sp_token");
      } catch {
        // ignore
      }
    },
    finishInitializing: (state) => {
      state.isInitializing = false;
    },
  },
});

export const { setCredentials, clearCredentials, finishInitializing } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export const selectIsInitializing = (state) => state.auth.isInitializing;