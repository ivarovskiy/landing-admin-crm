import { getPublicPage } from "@/lib/api-public";
import { PageRenderer } from "@/components/page-renderer";
import { tokensToCssVars } from "@/lib/theme";
import { notFound } from "next/navigation";

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (slug === "home") notFound();

  const res = await getPublicPage(slug, "uk");

  if (!res.ok) {
    if (res.error?.kind === "http" && res.error.status === 404) {
      notFound();
    }
    console.error(`[web] getPublicPage("${slug}") failed:`, res.error);
    notFound();
  }

  const { page, theme } = res.data;
  const cssVars = tokensToCssVars(theme?.tokens ?? theme);

  return (
    <main style={cssVars} className="page-base">
      <PageRenderer blocks={(page as any).blocks ?? []} pageSettings={(page as any).settings} />
    </main>
  );
}
