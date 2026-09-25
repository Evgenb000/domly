import { create } from "zustand";
import type { AuthUserDto } from "@domly/shared";

interface SessionState {
  accessToken: string | null;
  user: AuthUserDto | null;
  setSession: (accessToken: string, user: AuthUserDto | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  accessToken: null,
  user: null,
  setSession: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
}));