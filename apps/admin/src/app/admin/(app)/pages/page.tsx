import { fetchAdminPages, createPreviewToken } from "@/lib/admin-api"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@acme/ui";
import { redirect } from "next/navigation"
import { Button } from "@acme/ui";
import Link from "next/link"
import page from "../page"

export default async function PagesIndex() {
  // const { items } = await fetchAdminPages()
  // cast or annotate the result so `data` isn’t typed as `never`
  const data = await fetchAdminPages() as { items?: Array<any> }
  const items = data.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pages</h1>
          <p className="text-sm text-muted-foreground">Read-only list (MVP)</p>
        </div>

        <Button asChild>
          <Link href="/admin/pages/new">New page</Link>
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Slug</TableHead>
              <TableHead>Locale</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Blocks</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link className="underline" href={`/admin/pages/${p.id}`}>
                    {p.slug}
                  </Link>
                </TableCell>
                <TableCell>{p.locale}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{p.blocksCount}</TableCell>
                <TableCell>{new Date(p.updatedAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/api/preview/${p.id}`} target="_blank" rel="noreferrer">
                      Preview
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}