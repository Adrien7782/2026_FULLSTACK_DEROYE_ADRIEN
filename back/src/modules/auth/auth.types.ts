export type UserRoleValue = "standard" | "admin";

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  isLikesPrivate: boolean;
  role: UserRoleValue;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicSession = {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthContext = {
  user: PublicUser;
  session: PublicSession;
};
