import { getGlobalBlocksForPage, getPublicPage, getSiteSettings, mergeGlobalBlocks } from "@/lib/api-public";
import { PageRenderer } from "@/components/page-renderer";
import { tokensToCssVars } from "@/lib/theme";
import { notFound } from "next/navigation";

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "home") notFound();

  const [pageRes, settingsRes] = await Promise.all([
    getPublicPage(slug, "uk"),
    getSiteSettings(),
  ]);

  if (!pageRes.ok) {
    if (pageRes.error?.kind === "http" && pageRes.error.status === 404) {
      notFound();
    }
    console.error(`[web] getPublicPage("${slug}") failed:`, pageRes.error);
    notFound();
  }

  const { page, theme } = pageRes.data;
  const globalsRes = await getGlobalBlocksForPage((page as any).id);

  const cssVars = tokensToCssVars(theme?.tokens ?? theme);
  const pageBlocks: any[] = (page as any).blocks ?? [];
  const blocks = mergeGlobalBlocks(
    pageBlocks,
    globalsRes.ok ? globalsRes.data : null,
    (page as any).settings,
  );
  const blockFillViewport = blocks.some((b) => b.data?.options?.fillViewport === true);
  const baseZoom = settingsRes.ok ? (settingsRes.data?.zoom ?? null) : null;
  const zoomSettings = blockFillViewport ? { ...baseZoom, fitViewport: true } : baseZoom;

  return (
    <main style={cssVars} className="page-base">
      <PageRenderer blocks={blocks} zoomSettings={zoomSettings} />
    </main>
  );
}
