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
  const { editMode, updateBlock } = useLivePreviewEdit();
  const Comp = blockRegistry[blockKey];
  if (!Comp) return null;
  return (
    <Comp
      data={data}
      editMode={
        editMode &&
        (blockKey === "hero:slider-v1" ||
          (blockKey === "content-page:v1" && data?.grid?.enabled === true))
      }
      onChange={(next: any) => updateBlock(blockId, next)}
    />
  );
}
