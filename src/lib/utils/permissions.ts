import type { Role } from "@/lib/supabase/types";

export const ROLE_LABELS: Record<Role, string> = {
  COLLABORATOR: "Colaborador",
  MANAGER: "Gestor",
  DIRECTOR: "Diretor",
  DIRETOR_CENTRAL: "Diretor Central",
  ADMIN: "Administrador",
};

export const ROLE_COLORS: Record<Role, string> = {
  COLLABORATOR: "bg-blue-100 text-blue-700",
  MANAGER: "bg-green-100 text-green-700",
  DIRECTOR: "bg-purple-100 text-purple-700",
  DIRETOR_CENTRAL: "bg-indigo-100 text-indigo-700",
  ADMIN: "bg-red-100 text-red-700",
};

export function isAdmin(role: Role | string): boolean {
  return role === "ADMIN";
}

export function isDirectorOrAbove(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRECTOR" || role === "DIRETOR_CENTRAL";
}

export function isManagerOrAbove(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRETOR_CENTRAL" || role === "DIRECTOR" || role === "MANAGER";
}

export function canApproveCompliments(role: Role | string): boolean {
  return role === "MANAGER" || role === "ADMIN" || role === "DIRETOR_CENTRAL";
}

export function canEvaluateCompliments(role: Role | string): boolean {
  return role === "DIRECTOR" || role === "DIRETOR_CENTRAL" || role === "ADMIN";
}

export function canViewAllAreas(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRECTOR" || role === "DIRETOR_CENTRAL";
}

export function canManageUsers(role: Role | string): boolean {
  return role === "ADMIN";
}

export function canViewAudit(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRETOR_CENTRAL";
}

export function canExportReports(role: Role | string): boolean {
  return role === "ADMIN" || role === "DIRETOR_CENTRAL" || role === "DIRECTOR" || role === "MANAGER";
}
