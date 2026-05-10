import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, Settings, LayoutPanelTop } from "lucide-react";
import { AdminThemeMenu } from "@/components/admin-theme-menu";

async function logoutAction() {
  "use server";
  (await cookies()).delete("access_token");
  redirect("/admin/login");
}

export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();

  return (
    <div
      data-admin-theme-shell
      data-admin-theme="light"
      className="admin-shell admin-theme admin-touch min-h-screen bg-background text-foreground flex flex-col"
    >
      <header className="admin-shell__header border-b border-border/70 bg-card/95 flex items-center px-4 shrink-0">
        <Link
          href="/admin"
          className="admin-shell__brand flex items-center gap-2 rounded-md hover:bg-muted/70 transition-colors"
        >
          <div className="admin-shell__mark rounded-md bg-primary flex items-center justify-center shrink-0">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5h6M5 2v6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-foreground">Admin</span>
        </Link>

        <div className="flex-1" />

        <div className="admin-shell__actions flex items-center gap-3">
          <Link
            href="/admin/globals"
            className="admin-shell__nav-link flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <LayoutPanelTop size={15} />
            Globals
          </Link>
          <Link
            href="/admin/settings"
            className="admin-shell__nav-link flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <Settings size={15} />
            Settings
          </Link>
          <AdminThemeMenu />
          <span className="admin-shell__email text-xs text-muted-foreground">{me?.user?.email ?? "-"}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="admin-shell__nav-link flex items-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
