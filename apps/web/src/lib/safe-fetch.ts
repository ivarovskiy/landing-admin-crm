export type FetchFail =
  | { kind: "network"; message: string }
  | { kind: "timeout"; message: string }
  | { kind: "http"; status: number; message: string; requestId?: string; body?: any };

export type FetchResult<T> =
  | { ok: true; data: T; requestId?: string }
  | { ok: false; error: FetchFail };

export async function safeFetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<FetchResult<T>> {
  const timeoutMs = init?.timeoutMs ?? 8000;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const requestId = res.headers.get("x-request-id") ?? undefined;

    let body: any = undefined;
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      try {
        body = await res.json();
      } catch {
        body = undefined;
      }
    } else {
      try {
        body = await res.text();
      } catch {
        body = undefined;
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: {
          kind: "http",
          status: res.status,
          message: (body?.message as string) || res.statusText || "HTTP error",
          requestId,
          body,
        },
      };
    }

    return { ok: true, data: body as T, requestId };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      return { ok: false, error: { kind: "timeout", message: `Timeout after ${timeoutMs}ms` } };
    }
    return { ok: false, error: { kind: "network", message: e?.message ?? "fetch failed" } };
  } finally {
    clearTimeout(t);
  }
}