import { create } from "zustand";
import type { AuthUserDto } from "@domly/shared";

interface SessionState {
  accessToken: string | null;
  user: AuthUserDto | null;
  isInitializing: boolean;
  setSession: (accessToken: string, user: AuthUserDto | null) => void;
  clear: () => void;
  finishInitializing: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  isInitializing: true,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
  finishInitializing: () => set({ isInitializing: false }),
}));