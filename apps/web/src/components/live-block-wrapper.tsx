"use client";

import { blockRegistry } from "./blocks/registry";
import { useLiveBlock, useLivePreviewEdit } from "./live-preview-provider";

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
  // All other blocks: editMode is gated by the toolbox Text button so text editing is always
  // intentional and works across every block type on the page simultaneously.
  const effectiveEditMode =
    blockKey === "hero:slider-v1"
      ? editMode
      : toolboxState.text;

  return (
    <Comp
      data={data}
      editMode={effectiveEditMode}
      onChange={(next: any) => updateBlock(blockId, next)}
    />
  );
}
