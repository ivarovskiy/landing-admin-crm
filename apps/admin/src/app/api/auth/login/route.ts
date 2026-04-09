import { NextResponse } from "next/server"

const TOKEN_COOKIE = "access_token"

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)

  if (!body?.email || !body?.password) {
    return NextResponse.json({ message: "email/password required" }, { status: 400 })
  }

  const apiUrl = process.env.API_URL
  if (!apiUrl) {
    return NextResponse.json({ message: "API_URL is not set" }, { status: 500 })
  }

  const upstream = await fetch(`${apiUrl}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  })

  const data = await upstream.json().catch(() => ({}))

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status })
  }

  // Підлаштуй поле токена під фактичну відповідь бекенду (подивись у Swagger /docs)
  const token: string | undefined = data?.accessToken ?? data?.token ?? data?.access_token
  if (!token) {
    return NextResponse.json({ message: "Token not found in login response" }, { status: 502 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 днів
  })
  return res
}