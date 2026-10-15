import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "bookleaf-super-secret-production-key-2026"
);

export const COOKIE_NAME = "bookleaf_session";

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      authorCode: true,
      city: true,
      phone: true,
      joinedDate: true
    }
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRole: Role) {
  const user = await requireAuth();
  if (user.role !== allowedRole) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
