import { getPublicPage, getSiteSettings } from "@/lib/api-public";
import { PageRenderer } from "@/components/page-renderer";
import { tokensToCssVars } from "@/lib/theme";

function Offline({ error }: { error: any }) {
  return (
    <main className="page-base">
      <div className="ds-container offline-page">
        <div className="ds-card offline-page__card">
          <div className="ds-kicker">Landing temporarily unavailable</div>
          <div className="offline-page__detail">
            {error?.kind === "http" ? (
              <>
                API responded with <b>{error.status}</b>
                {error.requestId ? <> (requestId: <b>{error.requestId}</b>)</> : null}
              </>
            ) : (
              <>{error?.message ?? "fetch failed"}</>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function Home() {
  const [pageRes, settingsRes] = await Promise.all([
    getPublicPage("home", "uk"),
    getSiteSettings(),
  ]);

  if (!pageRes.ok) {
    console.error("[web] getPublicPage failed:", pageRes.error);
    return <Offline error={pageRes.error} />;
  }

  const { page, theme } = pageRes.data;
  const cssVars = tokensToCssVars(theme?.tokens ?? theme);
  const blocks: any[] = (page as any).blocks ?? [];
  const blockFillViewport = blocks.some((b) => b.data?.options?.fillViewport === true);
  const baseZoom = settingsRes.ok ? (settingsRes.data?.zoom ?? null) : null;
  const zoomSettings = blockFillViewport ? { ...baseZoom, fitViewport: true } : baseZoom;

  return (
    <main style={cssVars} className="page-base">
      <PageRenderer blocks={(page as any).blocks ?? []} zoomSettings={zoomSettings} />
    </main>
  );
}
