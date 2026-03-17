import { createContext } from "react";
import type {
  LoginInput,
  RegisterInput,
  SessionInfo,
  SessionUser,
  UpdateProfileInput,
} from "../lib/api";

export type SessionContextValue = {
  user: SessionUser | null;
  session: SessionInfo | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isBusy: boolean;
  error: string;
  clearError: () => void;
  reloadSession: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
