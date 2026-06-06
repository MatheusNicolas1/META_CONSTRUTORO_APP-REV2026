import type { UserRole } from "@/types/user";

export const PLATFORM_PRESIDENT_EMAIL = "matheusnicolas.org@gmail.com";

export const isPlatformPresidentEmail = (email?: string | null) =>
  (email || "").trim().toLowerCase() === PLATFORM_PRESIDENT_EMAIL;

export const isPlatformPresidentUser = (user?: { email?: string | null } | null) =>
  isPlatformPresidentEmail(user?.email);

export const canAccessPlatformAdmin = (roles: UserRole[]) =>
  roles.includes("Presidente");

export const canManagePlatformAdmins = (roles: UserRole[]) =>
  roles.includes("Presidente");
