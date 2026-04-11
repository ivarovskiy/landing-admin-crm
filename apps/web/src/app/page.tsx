import { getPublicPage } from "@/lib/api-public";
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
  const res = await getPublicPage("home", "uk");

  if (!res.ok) {
    console.error("[web] getPublicPage failed:", res.error);
    return <Offline error={res.error} />;
  }

  const { page, theme } = res.data;
  const cssVars = tokensToCssVars(theme?.tokens ?? theme);

  return (
    <main style={cssVars} className="page-base">
      <PageRenderer blocks={(page as any).blocks ?? []} pageSettings={(page as any).settings} />
    </main>
  );
}
