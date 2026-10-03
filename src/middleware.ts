import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "cm_session";
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

function getSecret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? "");
}

async function readRole(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const role = payload.role as string;
    return role === "BOSS" ? "DIRECTOR" : role;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const role = await readRole(token);
  const isApi = pathname.startsWith("/api");

  if (!role) {
    if (isApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/employees") && role !== "DIRECTOR") {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/boss") && !["DIRECTOR", "ADMIN"].includes(role)) {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  // Allow GET /api/employees for all (task assignment dropdown) but block POST/PATCH for non-DIRECTOR
  if (pathname.startsWith("/api/employees") && role !== "DIRECTOR" && req.method !== "GET") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
