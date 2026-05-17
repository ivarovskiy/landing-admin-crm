"use client";

import { blockRegistry } from "./blocks/registry";
import { useLiveBlock, useLivePreviewEdit } from "./live-preview-provider";

const OTHER_TEXT_EDITABLE = new Set([
  "content-page:v1",
  "text-block:v1",
  "image-block:v1",
  "new-student-memo:v1",
]);

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
  // Other editable blocks: editMode is gated by the toolbox Text button so text editing
  // is always intentional and works across all sections simultaneously.
  const effectiveEditMode =
    blockKey === "hero:slider-v1"
      ? editMode
      : OTHER_TEXT_EDITABLE.has(blockKey)
        ? toolboxState.text
        : false;

  return (
    <Comp
      data={data}
      editMode={effectiveEditMode}
      onChange={(next: any) => updateBlock(blockId, next)}
    />
  );
}
