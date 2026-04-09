"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Smartphone, Monitor, Minus } from "lucide-react";
import { Button } from "@acme/ui";
import type { BlockHide, BlockLayout } from "@/types/block";
import { readHide, desktopVisibilityState } from "@/lib/visibility";

export function BlockVisibilityControls({
  blockId,
  initial,
}: {
  blockId: string;
  initial: any;
}) {
  const router = useRouter();
  const [hide, setHide] = useState<BlockHide>(() => readHide(initial));
  const [saving, setSaving] = useState<null | "mobile" | "desktop">(null);
  const [error, setError] = useState<string | null>(null);

  const desktopState = desktopVisibilityState(hide);

  async function persist(nextHide: BlockHide) {
    const nextData: Record<string, any> = { ...(initial ?? {}) };
    const nextLayout: BlockLayout = { ...(nextData._layout ?? {}) };

    nextLayout.hide = { ...(nextLayout.hide ?? {}), ...nextHide };
    nextData._layout = nextLayout;

    const r = await fetch(`/api/admin/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ data: nextData }),
    });

    if (!r.ok) {
      const t = await r.text();
      throw new Error(t || `HTTP ${r.status}`);
    }
  }

  async function toggleMobile() {
    setError(null);
    const prev = hide;
    const next = { ...hide, base: !hide.base };

    setHide(next);
    setSaving("mobile");

    try {
      await persist(next);
      router.refresh();
    } catch (e: any) {
      setHide(prev);
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function toggleDesktop() {
    setError(null);
    const prev = hide;

    const shouldHide = desktopState !== "hidden";
    const next = { ...hide, md: shouldHide, lg: shouldHide };

    setHide(next);
    setSaving("desktop");

    try {
      await persist(next);
      router.refresh();
    } catch (e: any) {
      setHide(prev);
      setError(e?.message ?? "Save failed");
    } finally {
      setSaving(null);
    }
  }

  const mobileHidden = !!hide.base;
  const desktopHidden = desktopState === "hidden";
  const desktopMixed = desktopState === "mixed";

  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        size="icon-xs"
        variant={mobileHidden ? "outline" : "secondary"}
        onClick={toggleMobile}
        disabled={saving !== null}
        title={mobileHidden ? "Show on mobile" : "Hide on mobile"}
      >
        <Smartphone className="h-3 w-3" />
      </Button>

      <Button
        type="button"
        size="icon-xs"
        variant={desktopHidden ? "outline" : "secondary"}
        onClick={toggleDesktop}
        disabled={saving !== null}
        title={desktopHidden ? "Show on desktop" : "Hide on desktop"}
      >
        {desktopMixed ? <Minus className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
      </Button>

      {error ? (
        <span className="ml-1 text-[10px] text-red-600 max-w-[120px] truncate">
          {error}
        </span>
      ) : null}
    </div>
  );
}
