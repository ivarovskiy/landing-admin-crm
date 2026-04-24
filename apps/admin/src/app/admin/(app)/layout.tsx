import { requireUser } from "@/lib/auth"
import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { LogOut, Settings, LayoutPanelTop } from "lucide-react"

async function logoutAction() {
  "use server"
  ;(await cookies()).delete("access_token")
  redirect("/admin/login")
}

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser()

  return (
    <div className="dark min-h-screen bg-[oklch(0.13_0_0)] text-[oklch(0.93_0_0)] flex flex-col">
      <header className="h-12 border-b border-[oklch(1_0_0/8%)] flex items-center px-4 shrink-0">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-2 h-8 rounded-md hover:bg-[oklch(1_0_0/6%)] transition-colors"
        >
          <div className="w-5 h-5 rounded-md bg-[oklch(0.58_0.22_25)] flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5 2v6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-[oklch(0.93_0_0)]">Admin</span>
        </Link>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <Link
            href="/admin/globals"
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium text-[oklch(0.55_0_0)] hover:text-[oklch(0.93_0_0)] hover:bg-[oklch(1_0_0/6%)] transition-colors"
          >
            <LayoutPanelTop size={13} />
            Globals
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium text-[oklch(0.55_0_0)] hover:text-[oklch(0.93_0_0)] hover:bg-[oklch(1_0_0/6%)] transition-colors"
          >
            <Settings size={13} />
            Settings
          </Link>
          <span className="text-xs text-[oklch(0.45_0_0)]">{me?.user?.email ?? "—"}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-2.5 h-7 rounded-md text-xs font-medium text-[oklch(0.55_0_0)] hover:text-[oklch(0.93_0_0)] hover:bg-[oklch(1_0_0/6%)] transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
