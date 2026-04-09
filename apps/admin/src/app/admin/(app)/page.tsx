import { requireUser } from "@/lib/auth"

export default async function AdminHome() {
  const me = await requireUser()
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Signed in as <b>{me?.user?.email ?? "unknown"}</b>
      </p>
    </div>
  )
}