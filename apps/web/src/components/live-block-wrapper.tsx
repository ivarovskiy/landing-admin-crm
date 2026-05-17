"use client";

import { blockRegistry } from "./blocks/registry";
import { useLiveBlock, useLivePreviewEdit } from "./live-preview-provider";

// Blocks that never receive inline editMode — no TipTap, no editable content.
const TEXT_NOT_EDITABLE = new Set(["header:v1", "footer:v1"]);

export function LiveBlockWrapper({
  blockId,
  blockKey,
  serverData,
}: {
  blockId: string;
  blockKey: string;
  serverData: any;
}) {
  const data = useLiveBlock(blockId, serverData);
  const { editMode, toolboxState, updateBlock } = useLivePreviewEdit();
  const Comp = blockRegistry[blockKey];
  if (!Comp) return null;

  // Hero slider manages toolbox (text/drag/guides) internally — always gets editMode from context.
  // Header/footer have no editable text content — always false.
  // All other blocks: gated by the toolbox Text button.
  const effectiveEditMode =
    blockKey === "hero:slider-v1"
      ? editMode
      : TEXT_NOT_EDITABLE.has(blockKey)
        ? false
        : toolboxState.text;

  return (
    <Comp
      data={data}
      editMode={effectiveEditMode}
      onChange={(next: any) => updateBlock(blockId, next)}
    />
  );
}
