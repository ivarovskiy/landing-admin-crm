"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";

type Phase = "idle" | "confirm" | "deleting";

export function DeleteBlockButton({
  blockId,
  onResult,
}: {
  blockId: string;
  onResult?: (r: { ok: boolean; message?: string }) => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-revert from "confirm" after 2.5s with no second click
  useEffect(() => {
    if (phase === "confirm") {
      timerRef.current = setTimeout(() => setPhase("idle"), 2500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  // Reset when blockId changes (different block selected)
  useEffect(() => {
    setPhase("idle");
  }, [blockId]);

  async function handleClick() {
    if (phase === "idle") {
      setPhase("confirm");
      return;
    }
    if (phase === "confirm") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("deleting");
      try {
        const r = await fetch(`/api/admin/blocks/${blockId}`, { method: "DELETE" });
        if (!r.ok) throw new Error(await r.text());
        onResult?.({ ok: true, message: "Block deleted" });
        router.refresh();
      } catch (e: any) {
        onResult?.({ ok: false, message: e?.message ?? "Delete failed" });
        setPhase("idle");
      }
    }
  }

  const isIdle = phase === "idle";
  const isConfirm = phase === "confirm";
  const isDeleting = phase === "deleting";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDeleting}
      title={isIdle ? "Delete block" : isConfirm ? "Click again to confirm" : "Deleting…"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        height: 22,
        padding: isIdle ? "0 5px" : "0 7px",
        borderRadius: 5,
        border: `1px solid ${isConfirm ? "rgba(239,68,68,0.6)" : "transparent"}`,
        background: isConfirm
          ? "rgba(239,68,68,0.12)"
          : isIdle
            ? "transparent"
            : "rgba(239,68,68,0.08)",
        color: isIdle ? "var(--color-muted-foreground, #888)" : "rgb(239,68,68)",
        cursor: isDeleting ? "default" : "pointer",
        fontSize: 10,
        fontWeight: 500,
        transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease, padding 0.15s ease",
        whiteSpace: "nowrap",
        opacity: isDeleting ? 0.5 : 1,
      }}
    >
      {isConfirm ? (
        <AlertTriangle style={{ width: 11, height: 11, flexShrink: 0 }} />
      ) : (
        <Trash2 style={{ width: 11, height: 11, flexShrink: 0 }} />
      )}
      {isConfirm && <span>Sure?</span>}
      {isDeleting && <span>…</span>}
    </button>
  );
}
