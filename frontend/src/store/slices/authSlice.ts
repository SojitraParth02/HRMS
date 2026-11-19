import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User, AuthState, SetCredentialsPayload } from "../../types/auth.types";

const getInitialAuthState = (): AuthState => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
    };
  }

  try {
    const storedToken: string | null = localStorage.getItem("token");
    const storedUserRaw: string | null = localStorage.getItem("user");

    if (storedToken && storedUserRaw) {
      const parsedUser: User = JSON.parse(storedUserRaw) as User;
      if (
        parsedUser &&
        typeof parsedUser.id === "string" &&
        typeof parsedUser.email === "string" &&
        typeof parsedUser.username === "string" &&
        typeof parsedUser.role === "string"
      ) {
        return {
          user: parsedUser,
          token: storedToken,
          isAuthenticated: true,
        };
      }
    }
  } catch (error) {
    console.error("Failed to rehydrate auth state from localStorage:", error);
  }

  return {
    user: null,
    token: null,
    isAuthenticated: false,
  };
};

const initialState: AuthState = getInitialAuthState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state: AuthState,
      action: PayloadAction<SetCredentialsPayload>
    ): void => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("token", action.payload.token);
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        } catch (error) {
          console.error("Failed to persist auth state to localStorage:", error);
        }
      }
    },
    logout: (state: AuthState): void => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        } catch (error) {
          console.error("Failed to remove auth state from localStorage:", error);
        }
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
