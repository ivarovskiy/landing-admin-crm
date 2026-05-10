"use client";

import type React from "react";
import { useRef } from "react";

type DragState = {
  pointerId: number;
  startX: number;
  startWidth: number;
  scale: number;
};

function readScale(el: HTMLElement) {
  const section = el.closest<HTMLElement>(".landing-section, .hero-slide, [data-block-id]");
  if (!section) return 1;
  const rect = section.getBoundingClientRect();
  return section.offsetWidth ? rect.width / section.offsetWidth || 1 : 1;
}

export function MediaResizeHandle({
  targetRef,
  minWidth = 120,
  maxWidth,
  onResize,
}: {
  targetRef: React.RefObject<HTMLElement | null>;
  minWidth?: number;
  maxWidth?: number;
  onResize: (width: string) => void;
}) {
  const dragRef = useRef<DragState | null>(null);

  return (
    <button
      type="button"
      className="media-resize-handle"
      title="Drag to resize"
      aria-label="Drag to resize image proportionally"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        const target = targetRef.current;
        if (!target) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        target.classList.add("media-resize-target--resizing");
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startWidth: target.getBoundingClientRect().width,
          scale: readScale(target),
        };
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        const target = targetRef.current;
        if (!drag || !target) return;
        event.preventDefault();
        event.stopPropagation();
        const dx = (event.clientX - drag.startX) / drag.scale;
        const next = Math.max(minWidth, Math.round(drag.startWidth + dx));
        const width = maxWidth ? Math.min(next, maxWidth) : next;
        target.style.width = `${width}px`;
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        const target = targetRef.current;
        dragRef.current = null;
        if (!drag || !target) return;
        event.preventDefault();
        event.stopPropagation();
        target.classList.remove("media-resize-target--resizing");
        const width = Math.max(minWidth, Math.round(target.getBoundingClientRect().width / drag.scale));
        onResize(`${maxWidth ? Math.min(width, maxWidth) : width}px`);
        try {
          event.currentTarget.releasePointerCapture(drag.pointerId);
        } catch {}
      }}
      onPointerCancel={(event) => {
        const drag = dragRef.current;
        const target = targetRef.current;
        dragRef.current = null;
        target?.classList.remove("media-resize-target--resizing");
        if (!drag || !target) return;
        target.style.width = `${Math.round(drag.startWidth / drag.scale)}px`;
        try {
          event.currentTarget.releasePointerCapture(drag.pointerId);
        } catch {}
      }}
    />
  );
}
