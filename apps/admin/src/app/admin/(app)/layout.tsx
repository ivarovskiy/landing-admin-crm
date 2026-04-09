import { requireUser } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@acme/ui"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

async function logoutAction() {
  "use server"
  // варіант 1 (якщо доступний):
  ;(await
    // варіант 1 (якщо доступний):
    cookies()).delete("access_token")

  // якщо delete раптом не доступний — використовуй замість нього:
  // cookies().set("access_token", "", { path: "/", maxAge: 0 })

  redirect("/admin/login")
}

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser()

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link className="font-semibold" href="/admin">
              Admin
            </Link>
            <Link className="text-sm underline" href="/admin/pages">
              Pages
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{me?.user?.email ?? "—"}</span>
            <form action={logoutAction}>
              <Button variant="secondary" type="submit">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto p-6">{children}</main>
    </div>
  )
}