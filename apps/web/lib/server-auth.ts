import { cookies } from "next/headers";
import { AUTH_TOKEN_KEY } from "@/lib/auth-store";

export async function getServerAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_KEY)?.value ?? null;
}

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  partnerId: string | null;
};

export function decodeTokenPayload(token: string | null): JwtPayload | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf-8"),
    );
    return payload as JwtPayload;
  } catch {
    return null;
  }
}
