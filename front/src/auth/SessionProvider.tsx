import { startTransition, useEffect, useState, type ReactNode } from "react";
import {
  ApiClientError,
  type LoginInput,
  type RegisterInput,
  type SessionInfo,
  type SessionUser,
  type UpdateProfileInput,
  getCurrentUser,
  loginUser,
  logoutAllSessions,
  logoutUser,
  refreshSession,
  registerUser,
  updateCurrentUser,
} from "../lib/api";
import { SessionContext } from "./sessionContext";

type SessionProviderProps = {
  children: ReactNode;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unexpected authentication error";

export function SessionProvider({ children }: SessionProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState("");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const applyAuthenticatedState = (nextUser: SessionUser, nextSession: SessionInfo) => {
    startTransition(() => {
      setUser(nextUser);
      setSession(nextSession);
      setError("");
    });
  };

  const clearSessionState = () => {
    startTransition(() => {
      setUser(null);
      setSession(null);
    });
  };

  const reloadSession = async () => {
    try {
      const payload = await getCurrentUser();
      applyAuthenticatedState(payload.user, payload.session);
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401) {
        clearSessionState();
        setError("");
        return;
      }
      // 429 or network error — don't clear the session, just ignore
      if (error instanceof ApiClientError && (error.status === 429 || error.status === 0)) {
        return;
      }
      clearSessionState();
      setError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      try {
        const payload = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        startTransition(() => {
          setUser(payload.user);
          setSession(payload.session);
          setError("");
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          clearSessionState();
          setError("");
        } else {
          clearSessionState();
          setError(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const wrapAction = async (callback: () => Promise<void>) => {
    setIsBusy(true);
    setError("");

    try {
      await callback();
    } catch (error) {
      setError(getErrorMessage(error));
      throw error;
    } finally {
      setIsBusy(false);
    }
  };

  const login = (input: LoginInput) =>
    wrapAction(async () => {
      const payload = await loginUser(input);
      applyAuthenticatedState(payload.user, payload.session);
    });

  const register = (input: RegisterInput) =>
    wrapAction(async () => {
      const payload = await registerUser(input);
      applyAuthenticatedState(payload.user, payload.session);
    });

  const refresh = () =>
    wrapAction(async () => {
      const payload = await refreshSession();
      applyAuthenticatedState(payload.user, payload.session);
    });

  const logout = () =>
    wrapAction(async () => {
      await logoutUser();
      clearSessionState();
    });

  const logoutAll = () =>
    wrapAction(async () => {
      await logoutAllSessions();
      clearSessionState();
    });

  const updateProfile = (input: UpdateProfileInput) =>
    wrapAction(async () => {
      const payload = await updateCurrentUser(input);
      applyAuthenticatedState(payload.user, payload.session);
    });

  return (
    <SessionContext.Provider
      value={{
        user,
        session,
        isAuthenticated: user !== null,
        isBootstrapping,
        isBusy,
        error,
        clearError: () => setError(""),
        reloadSession,
        login,
        register,
        refresh,
        logout,
        logoutAll,
        updateProfile,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
