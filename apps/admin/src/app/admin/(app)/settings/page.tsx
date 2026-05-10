import { requireUser } from "@/lib/auth"
import { fetchSiteSettings } from "@/lib/admin-api"
import { SiteSettingsForm } from "@/components/site-settings-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SettingsPage() {
  await requireUser()

  let settings: any = {}
  try {
    settings = await fetchSiteSettings()
  } catch {}

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <Link
          href="/admin"
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All pages
        </Link>

        <div>
          <h1 className="text-xl font-semibold text-foreground">Site Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Global settings applied to all pages</p>
        </div>

        <SiteSettingsForm initialSettings={settings} />

      </div>
    </div>
  )
}
