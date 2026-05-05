import { getGlobalBlocksForPage, getPublicPage, getSiteSettings, mergeGlobalBlocks } from "@/lib/api-public";
import { PageRenderer } from "@/components/page-renderer";
import { tokensToCssVars } from "@/lib/theme";
import { notFound } from "next/navigation";

export default async function NewStudentMemoPage() {
  const [pageRes, settingsRes] = await Promise.all([
    getPublicPage("new-student-memo", "uk"),
    getSiteSettings(),
  ]);

  if (!pageRes.ok) {
    if (pageRes.error?.kind === "http" && pageRes.error.status === 404) {
      notFound();
    }
    console.error("[web] getPublicPage(new-student-memo) failed:", pageRes.error);
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
  const baseZoom = settingsRes.ok ? (settingsRes.data?.zoom ?? null) : null;

  return (
    <main style={cssVars} className="page-base">
      <PageRenderer blocks={blocks} zoomSettings={baseZoom} />
    </main>
  );
}
