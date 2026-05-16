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
export type ToolboxState = { text: boolean; drag: boolean; guides: boolean };
type LivePreviewValue = {
  overrides: Overrides;
  editMode: boolean;
  toolboxState: ToolboxState;
  updateBlock: (blockId: string, data: any) => void;
};

const LivePreviewContext = createContext<LivePreviewValue>({
  overrides: {},
  editMode: false,
  toolboxState: { text: false, drag: false, guides: false },
  updateBlock: () => {},
});

export function useLiveBlock(blockId: string, serverData: any): any {
  const { overrides } = useContext(LivePreviewContext);
  return overrides[blockId] ?? serverData;
}

export function useLivePreviewEdit() {
  const { editMode, toolboxState, updateBlock } = useContext(LivePreviewContext);
  return { editMode, toolboxState, updateBlock };
}

export function LivePreviewProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [editMode, setEditMode] = useState(false);
  const [toolboxState, setToolboxState] = useState<ToolboxState>({ text: false, drag: false, guides: false });

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
      if (type === "set-toolbox-state") {
        setToolboxState({
          text: e.data?.text === true,
          drag: e.data?.drag === true,
          guides: e.data?.guides === true,
        });
      }
    }

    window.addEventListener("message", handleMessage);
    // Signal admin that listeners are ready so it re-sends the current edit mode.
    // This fixes the race where the admin posts before React has hydrated.
    window.parent.postMessage({ type: "iframe-ready" }, "*");
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
    () => ({ overrides, editMode, toolboxState, updateBlock }),
    [editMode, toolboxState, overrides, updateBlock],
  );

  return (
    <LivePreviewContext.Provider value={value}>
      {children}
    </LivePreviewContext.Provider>
  );
}
