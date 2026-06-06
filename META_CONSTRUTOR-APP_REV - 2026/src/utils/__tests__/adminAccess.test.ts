import { describe, expect, it } from "vitest";
import { hasRouteAccess } from "@/security/RBACMatrix";
import {
  PLATFORM_PRESIDENT_EMAIL,
  isPlatformPresidentEmail,
  isPlatformPresidentUser,
} from "../adminAccess";

describe("admin access", () => {
  it("allows only the presidential email to access platform metrics", () => {
    expect(isPlatformPresidentEmail(PLATFORM_PRESIDENT_EMAIL)).toBe(true);
    expect(isPlatformPresidentEmail("  MATHEUSNICOLAS.ORG@GMAIL.COM ")).toBe(true);
    expect(isPlatformPresidentEmail("usuario@empresa.com")).toBe(false);
    expect(isPlatformPresidentEmail(null)).toBe(false);
  });

  it("identifies the presidential user from auth context data", () => {
    expect(isPlatformPresidentUser({ email: PLATFORM_PRESIDENT_EMAIL })).toBe(true);
    expect(isPlatformPresidentUser({ email: "admin@empresa.com" })).toBe(false);
    expect(isPlatformPresidentUser(null)).toBe(false);
  });

  it("allows admin dashboard to Presidentes and Administradores por role", () => {
    // Presidente acessa pela role
    expect(hasRouteAccess("/app/admin/dashboard", "Presidente", "presidente@empresa.com")).toBe(true);
    // Administrador agora também acessa pela role
    expect(hasRouteAccess("/app/admin/dashboard", "Administrador", "admin@empresa.com")).toBe(true);
    // Colaborador não acessa
    expect(hasRouteAccess("/app/admin/dashboard", "Colaborador", "usuario@empresa.com")).toBe(false);
  });

  it("still allows the original presidential email as fallback", () => {
    // O email presidente ainda funciona via allowedEmails
    expect(hasRouteAccess("/app/admin/dashboard", "Colaborador", PLATFORM_PRESIDENT_EMAIL)).toBe(true);
  });
});
