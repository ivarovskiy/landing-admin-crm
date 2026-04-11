import { fetchAdminPage } from "@/lib/admin-api";
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

  const { page } = await fetchAdminPage(p.id);

  const blocks = Array.isArray(page.blocks) ? [...page.blocks] : [];
  blocks.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

  const initialBlockId = pickBlockId(sp);

  return (
    <BlocksWorkspace
      pageId={page.id}
      pageSlug={page.slug}
      pageStatus={page.status ?? "draft"}
      pageLayoutSettings={(page as any).settings}
      blocks={blocks}
      initialActiveId={initialBlockId}
    />
  );
}
