import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { fetchAdminPage } from "@/lib/admin-api"
import { Button, Card, CardContent, CardHeader, CardTitle } from "@acme/ui";

type P = { id: string }

async function deleteAction(formData: FormData) {
  "use server"
  const id = String(formData.get("id") ?? "")
  const token = (await cookies()).get("access_token")?.value
  if (!token) redirect("/admin/login")

  const apiUrl = process.env.API_URL ?? "http://localhost:3000"
  const r = await fetch(`${apiUrl}/v1/admin/pages/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (!r.ok) redirect(`/admin/pages/${id}?deleteError=${r.status}`)

  revalidatePath("/admin/pages")
  redirect("/admin/pages")
}

export default async function DeletePageConfirm({ params }: { params: P | Promise<P> }) {
  const p = await Promise.resolve(params)
  const { page } = await fetchAdminPage(p.id)

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        <Link className="underline" href="/admin/pages">Pages</Link> /{" "}
        <Link className="underline" href={`/admin/pages/${page.id}`}>{page.slug}</Link> / Delete
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Delete page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            You are about to delete <b>{page.slug}</b> ({page.locale}). This cannot be undone.
          </div>

          <div className="flex gap-2">
            <form action={deleteAction}>
              <input type="hidden" name="id" value={page.id} />
              <Button type="submit" variant="destructive">Yes, delete</Button>
            </form>

            <Button asChild variant="secondary">
              <Link href={`/admin/pages/${page.id}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}