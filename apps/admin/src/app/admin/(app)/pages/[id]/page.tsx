import { fetchAdminPage, fetchAdminPages } from "@/lib/admin-api";
import { BlocksWorkspace } from "@/components/blocks-workspace";

type P = { id: string };

function pickBlockId(sp: Record<string, string | string[]>) {
  const v = sp["block"];
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length) return v[0];
  return "";
}

export default async function AdminPageDetails({
  params,
  searchParams,
}: {
  params: P | Promise<P>;
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const p = await Promise.resolve(params);
  const sp = await Promise.resolve(searchParams);

  const [{ page }, allPagesRes] = await Promise.all([
    fetchAdminPage(p.id),
    fetchAdminPages().catch(() => ({ items: [] as any[] })),
  ]);

  const blocks = Array.isArray(page.blocks) ? [...page.blocks] : [];
  blocks.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  const initialBlockId = pickBlockId(sp);
  const allPages = ((allPagesRes as any).items ?? []).map((x: any) => ({
    id: x.id,
    slug: x.slug,
    parentId: x.parentId ?? null,
  }));

  return (
    <BlocksWorkspace
      pageId={page.id}
      pageSlug={page.slug}
      pageStatus={page.status ?? "draft"}
      pageParentId={(page as any).parentId ?? null}
      allPages={allPages}
      blocks={blocks}
      initialActiveId={initialBlockId}
    />
  );
}
