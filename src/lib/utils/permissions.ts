import type { Role } from "@/lib/supabase/types";

export const ROLE_LABELS: Record<Role, string> = {
  COLLABORATOR: "Colaborador",
  MANAGER: "Gestor",
  DIRECTOR: "Diretor",
  ADMIN: "Administrador",
};

export const ROLE_COLORS: Record<Role, string> = {
  COLLABORATOR: "bg-blue-100 text-blue-700",
  MANAGER: "bg-green-100 text-green-700",
  DIRECTOR: "bg-purple-100 text-purple-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function isAdmin(role: Role | string): boolean {
  return role === "ADMIN";
}

export function isDirectorOrAbove(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRECTOR";
}

export function isManagerOrAbove(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRECTOR" || role === "MANAGER";
}

export function canApproveCompliments(role: Role | string): boolean {
  return role === "MANAGER" || role === "ADMIN";
}

export function canEvaluateCompliments(role: Role | string): boolean {
  return role === "DIRECTOR" || role === "ADMIN";
}

export function canViewAllAreas(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRECTOR";
}

export function canManageUsers(role: Role | string): boolean {
  return role === "ADMIN";
}

export function canViewAudit(role: Role | string): boolean {
  return role === "ADMIN";
}

export function canExportReports(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRECTOR" || role === "MANAGER";
}

