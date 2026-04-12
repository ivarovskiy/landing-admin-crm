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
    <div className="min-h-screen bg-[oklch(0.13_0_0)] text-[oklch(0.93_0_0)] p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.6_0_0)] hover:text-[oklch(0.93_0_0)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All pages
        </Link>

        <div>
          <h1 className="text-base font-semibold text-[oklch(0.93_0_0)]">Site Settings</h1>
          <p className="text-xs text-[oklch(0.55_0_0)] mt-0.5">Global settings applied to all pages</p>
        </div>

        <SiteSettingsForm initialSettings={settings} />

      </div>
    </div>
  )
}
