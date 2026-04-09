import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export type MeResponse = {
  user?: { id: string; email: string; roles?: string[] }
}

export async function requireUser() {
  const token = (await cookies()).get("access_token")?.value
  if (!token) redirect("/admin/login")

  const apiUrl = process.env.API_URL
  if (!apiUrl) throw new Error("API_URL is not set")

  const r = await fetch(`${apiUrl}/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!r.ok) redirect("/admin/login")

  const data = (await r.json()) as MeResponse
  return data
}