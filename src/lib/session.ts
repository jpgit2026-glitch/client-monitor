import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "cm_session";
const ALG = "HS256";

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET env var is not set. Add one (any long random string) to .env"
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string; // employee id
  name: string;
  role: "BOSS" | "ADMIN" | "ACCOUNTING" | "LIAISON";
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ name: payload.name, role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSession() {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: payload.sub as string,
      name: payload.name as string,
      role: payload.role as SessionPayload["role"],
    };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
