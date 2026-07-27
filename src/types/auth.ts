export type Role = "buyer" | "seller" | "admin";

// Shape of the Better Auth session user, extended with our custom `role` field.
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  token: string;
}

// Augment Express's Request so req.user / req.session are typed everywhere
// once requireAuth has run.
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      session?: AuthSession;
    }
  }
}
