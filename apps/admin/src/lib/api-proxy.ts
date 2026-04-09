import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Read the access token from the httpOnly cookie. */
export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get("access_token")?.value ?? null;
}

/** Base URL of the upstream API, configurable via env. */
export function getApiUrl(): string {
  return process.env.API_URL ?? "http://localhost:3000";
}

/** Standard 401 response for unauthenticated requests. */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
}

/**
 * Proxy an upstream Response to a NextResponse, preserving status + content-type.
 * Falls back to `{ ok: true/false }` if the body is empty.
 */
export async function proxyResponse(upstream: Response): Promise<NextResponse> {
  const text = await upstream.text();
  const body = text || JSON.stringify({ ok: upstream.ok });
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
}

/** Build standard JSON auth headers for upstream requests. */
export function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
}
