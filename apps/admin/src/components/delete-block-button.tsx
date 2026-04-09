"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@acme/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui";

export function DeleteBlockButton({
  blockId,
  onResult,
}: {
  blockId: string;
  onResult?: (r: { ok: boolean; message?: string }) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function doDelete() {
    setPending(true);
    try {
      const r = await fetch(`/api/admin/blocks/${blockId}`, { method: "DELETE" });
      if (!r.ok) throw new Error(await r.text());

      onResult?.({ ok: true, message: "Block deleted" });
      setOpen(false);
      router.refresh();
    } catch (e: any) {
      onResult?.({ ok: false, message: e?.message ?? "Delete failed" });
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" type="button">
          Delete
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this block?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. The block will be removed from the page.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={doDelete} disabled={pending}>
            {pending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}