"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Overrides = Record<string, any>;

const LivePreviewContext = createContext<Overrides>({});

export function useLiveBlock(blockId: string, serverData: any): any {
  const overrides = useContext(LivePreviewContext);
  return overrides[blockId] ?? serverData;
}

export function LivePreviewProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});

  useEffect(() => {
    const isPreview = window !== window.parent;
    if (!isPreview) return;

    function handleMessage(e: MessageEvent) {
      const { type, blockId, data } = e.data ?? {};
      if (type === "update-block" && blockId && data) {
        setOverrides((prev) => ({ ...prev, [blockId]: data }));
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Report page height to admin so artboard matches content exactly
  useEffect(() => {
    const isPreview = window !== window.parent;
    if (!isPreview) return;

    function reportHeight() {
      const h = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: "page-height", height: h }, "*");
    }

    // Report immediately + on any resize
    reportHeight();
    const ro = new ResizeObserver(reportHeight);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  return (
    <LivePreviewContext.Provider value={overrides}>
      {children}
    </LivePreviewContext.Provider>
  );
}
