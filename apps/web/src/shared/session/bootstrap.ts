import { useSessionStore } from "./store";
import { getMe } from "./me";
import { refreshSession } from "./refresh";

export async function ensureSession(): Promise<void> {
  const { accessToken } = useSessionStore.getState();
  try {
    if (accessToken) {
      const user = await getMe();
      useSessionStore.getState().setSession(accessToken, user);
    } else {
      await refreshSession();
    }
  } catch {
    // stay anonymous; refreshSession clears the store when rotation fails
  } finally {
    useSessionStore.getState().finishInitializing();
  }
}