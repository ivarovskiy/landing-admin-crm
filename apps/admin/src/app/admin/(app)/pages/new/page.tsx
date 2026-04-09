import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@acme/ui";

async function createPageAction(formData: FormData) {
  "use server"

  const slug = String(formData.get("slug") ?? "").trim()
  const locale = String(formData.get("locale") ?? "uk").trim()

  const token = (await cookies()).get("access_token")?.value
  if (!token) redirect("/admin/login")

  const apiUrl = process.env.API_URL ?? "http://localhost:3000"

  const r = await fetch(`${apiUrl}/v1/admin/pages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ slug, locale }),
    cache: "no-store",
  })

  if (!r.ok) {
    // MVP: редірект назад з кодом (пізніше зробимо гарний error state)
    redirect(`/admin/pages/new?error=${r.status}`)
  }

  const data = (await r.json()) as { page: { id: string } }
  revalidatePath("/admin/pages")
  redirect(`/admin/pages/${data.page.id}`)
}

export default function NewPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link className="underline" href="/admin/pages">
          Pages
        </Link>{" "}
        / New
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>New page (draft)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {searchParams?.error ? (
            <div className="text-sm text-red-600">Create failed (HTTP {searchParams.error})</div>
          ) : null}

          <form action={createPageAction} className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Slug</div>
              <Input name="slug" placeholder="about-us" required />
              <div className="text-xs text-muted-foreground">kebab-case: a-z, 0-9, -</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Locale</div>
              <select
                name="locale"
                defaultValue="uk"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="uk">uk</option>
                <option value="en">en</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button asChild variant="secondary">
                <Link href="/admin/pages">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}