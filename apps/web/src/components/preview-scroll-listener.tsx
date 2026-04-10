"use client";

import { useEffect } from "react";

/**
 * Injected into preview pages to enable admin ↔ preview communication:
 * - Receives "scroll-to-block" messages → scrolls to block
 * - Receives "highlight-block" messages → shows persistent outline on block
 * - Receives "highlight-element" messages → shows persistent outline on element
 * - Sends "block-clicked" messages → tells admin which block was clicked
 * - Sends "element-clicked" messages → tells admin which element was clicked
 * - Adds hover outlines on blocks and elements
 */
export function PreviewScrollListener() {
  useEffect(() => {
    // Check if we're inside an iframe (preview mode)
    const isPreview = window !== window.parent;
    if (!isPreview) return;

    let activeBlockId: string | null = null;
    let activeElementId: string | null = null;

    /* ---- Inject overlay styles ---- */
    const originalStyles = `
      [data-block-id] {
        position: relative;
        transition: outline 0.15s ease;
      }
      [data-block-id]:hover {
        outline: 2px dashed hsl(217, 91%, 60%);
        outline-offset: -2px;
        cursor: pointer;
      }
      [data-block-id].preview-active {
        outline: 2px solid hsl(217, 91%, 60%);
        outline-offset: -2px;
      }
      [data-block-id]:hover::after {
        content: attr(data-block-label);
        position: absolute;
        top: 2px;
        left: 2px;
        background: hsl(217, 91%, 60%);
        color: white;
        font-size: 10px;
        font-family: system-ui, sans-serif;
        padding: 1px 6px;
        border-radius: 0 0 4px 0;
        z-index: 9999;
        pointer-events: none;
        line-height: 16px;
        font-weight: 500;
      }

      /* Element-level highlight */
      [data-el].preview-el-active {
        outline: 2px solid hsl(262, 83%, 58%);
        outline-offset: 2px;
        border-radius: 2px;
      }
      [data-el]:hover {
        outline: 1px dashed hsl(262, 83%, 58% / 0.5);
        outline-offset: 2px;
        cursor: pointer;
      }
      [data-el].preview-el-active:hover {
        outline: 2px solid hsl(262, 83%, 58%);
      }
    `;
    const style = document.createElement("style");
    style.textContent = originalStyles;
    document.head.appendChild(style);

    /* ---- Add labels to blocks ---- */
    document.querySelectorAll<HTMLElement>("[data-block-id]").forEach((el) => {
      // Find the section component inside to derive a label
      const section = el.querySelector("[class*='content-page'], [class*='features'], [class*='hero'], [class*='header'], [class*='footer'], [class*='studio-address'], [class*='scrapbook']");
      const className = section?.className?.split(/\s+/)[0] ?? "";
      const label = className || "block";
      el.setAttribute("data-block-label", label);
    });

    /* ---- Click handler: select block or element ---- */
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;

      // Check if an element with data-el was clicked (inside a block)
      const elTarget = target.closest<HTMLElement>("[data-el]");
      const blockTarget = target.closest<HTMLElement>("[data-block-id]");

      if (!blockTarget) return;

      e.preventDefault();
      e.stopPropagation();

      const blockId = blockTarget.dataset.blockId;
      if (!blockId) return;

      // Update active block
      setActiveBlock(blockId);

      if (elTarget) {
        const elementId = elTarget.dataset.el!;
        setActiveElement(blockId, elementId);

        // Notify admin about element click
        window.parent.postMessage(
          { type: "element-clicked", blockId, elementId },
          "*",
        );
      } else {
        clearActiveElement();

        // Notify admin about block click
        window.parent.postMessage(
          { type: "block-clicked", blockId },
          "*",
        );
      }
    }

    function setActiveBlock(blockId: string | null) {
      // Remove previous active
      if (activeBlockId) {
        document
          .querySelector(`[data-block-id="${CSS.escape(activeBlockId)}"]`)
          ?.classList.remove("preview-active");
      }

      activeBlockId = blockId;

      // Add new active
      if (blockId) {
        document
          .querySelector(`[data-block-id="${CSS.escape(blockId)}"]`)
          ?.classList.add("preview-active");
      }
    }

    function setActiveElement(blockId: string, elementId: string) {
      clearActiveElement();
      activeElementId = elementId;

      const blockEl = document.querySelector(`[data-block-id="${CSS.escape(blockId)}"]`);
      if (!blockEl) return;

      const elNode = blockEl.querySelector(`[data-el="${CSS.escape(elementId)}"]`);
      if (elNode) {
        elNode.classList.add("preview-el-active");
        elNode.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    function clearActiveElement() {
      if (activeElementId) {
        document
          .querySelectorAll(".preview-el-active")
          .forEach((el) => el.classList.remove("preview-el-active"));
        activeElementId = null;
      }
    }

    /* ---- Message handler from admin ---- */
    function handleMessage(e: MessageEvent) {
      const { type, blockId, elementId } = e.data ?? {};

      if (type === "scroll-to-block" && blockId) {
        const el = document.querySelector(
          `[data-block-id="${CSS.escape(blockId)}"]`,
        );
        if (el) {
          setActiveBlock(blockId);
          // Don't scroll the iframe — send the block's offsetTop back to canvas
          const offsetTop = (el as HTMLElement).getBoundingClientRect().top + window.scrollY;
          window.parent.postMessage({ type: "block-offset", blockId, offsetTop }, "*");
        }
      }

      if (type === "highlight-block") {
        setActiveBlock(blockId ?? null);
        clearActiveElement();
      }

      if (type === "highlight-element" && blockId && elementId) {
        setActiveBlock(blockId);
        setActiveElement(blockId, elementId);
      }

      if (type === "clear-element") {
        clearActiveElement();
      }
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("message", handleMessage);

    // Handle preview-mode toggle from admin
    function handlePreviewMode(e: MessageEvent) {
      if (e.data?.type !== "set-preview-mode") return;
      if (e.data.enabled) {
        // Disable all highlights and clicks
        style.textContent = "";
        document.removeEventListener("click", handleClick, true);
        document.querySelectorAll(".preview-active, .preview-el-active").forEach((el) => {
          el.classList.remove("preview-active", "preview-el-active");
        });
      } else {
        // Re-enable (restore original styles)
        style.textContent = originalStyles;
        document.addEventListener("click", handleClick, true);
      }
    }
    window.addEventListener("message", handlePreviewMode);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("message", handlePreviewMode);
      style.remove();
    };
  }, []);

  return null;
}
