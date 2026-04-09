"use client";

import { blockRegistry } from "./blocks/registry";
import { useLiveBlock } from "./live-preview-provider";

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
  const Comp = blockRegistry[blockKey];
  if (!Comp) return null;
  return <Comp data={data} />;
}
