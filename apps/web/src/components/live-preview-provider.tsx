"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Overrides = Record<string, any>;
type LivePreviewValue = {
  overrides: Overrides;
  editMode: boolean;
  updateBlock: (blockId: string, data: any) => void;
};

const LivePreviewContext = createContext<LivePreviewValue>({
  overrides: {},
  editMode: false,
  updateBlock: () => {},
});

export function useLiveBlock(blockId: string, serverData: any): any {
  const { overrides } = useContext(LivePreviewContext);
  return overrides[blockId] ?? serverData;
}

export function useLivePreviewEdit() {
  const { editMode, updateBlock } = useContext(LivePreviewContext);
  return { editMode, updateBlock };
}

export function LivePreviewProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const isPreview = window !== window.parent;
    if (!isPreview) return;

    function handleMessage(e: MessageEvent) {
      const { type, blockId, data } = e.data ?? {};
      if (type === "update-block" && blockId && data) {
        setOverrides((prev) => ({ ...prev, [blockId]: data }));
      }
      if (type === "set-live-edit-mode") {
        setEditMode(e.data?.enabled === true);
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

  const updateBlock = useCallback((blockId: string, data: any) => {
    setOverrides((prev) => ({ ...prev, [blockId]: data }));
    if (typeof window !== "undefined" && window !== window.parent) {
      window.parent.postMessage({ type: "live-block-change", blockId, data }, "*");
    }
  }, []);

  const value = useMemo(
    () => ({ overrides, editMode, updateBlock }),
    [editMode, overrides, updateBlock],
  );

  return (
    <LivePreviewContext.Provider value={value}>
      {children}
    </LivePreviewContext.Provider>
  );
}
