import { auth } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/verify-email", "/forgot-password", "/setup"];
const AUTH_ROUTES = ["/login", "/register", "/verify-email", "/forgot-password", "/setup"];

const ROLE_ROUTES: Record<string, string[]> = {
  "/users": ["ADMIN"],
  "/areas": ["ADMIN"],
  "/audit": ["ADMIN"],
  "/settings/deadlines": ["ADMIN"],
  "/settings/branches": ["ADMIN"],
  "/compliments/pending-approval": ["MANAGER", "ADMIN", "DIRETOR_CENTRAL"],
  "/compliments/pending-evaluation": ["DIRECTOR", "ADMIN", "DIRETOR_CENTRAL"],
  "/minha-equipe": ["DIRECTOR", "DIRETOR_CENTRAL"],
  "/rankings/collaborators": ["MANAGER", "DIRECTOR", "ADMIN", "DIRETOR_CENTRAL"],
  "/rankings/areas": ["DIRECTOR", "ADMIN", "DIRETOR_CENTRAL"],
  "/rankings/teams": ["MANAGER"],
  "/reports": ["ADMIN", "DIRECTOR", "MANAGER", "DIRETOR_CENTRAL"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Deixa rotas públicas passarem
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    if (session && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Rota de API de auth
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Requer autenticação
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = session.user?.role ?? "";

  // Rate limit básico via headers (aplicar lógica real no edge se necessário)
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Verificar permissões de rota
  for (const [route, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(route) || pathname.startsWith(`/api${route}`)) {
      if (!roles.includes(userRole)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Acesso não autorizado" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
