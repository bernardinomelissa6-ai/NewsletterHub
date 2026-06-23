import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function getSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  const userRole = session.user.role as Role;
  if (!roles.includes(userRole)) redirect("/dashboard");
  return session;
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}
