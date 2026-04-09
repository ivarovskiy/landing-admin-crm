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

  return (
    <LivePreviewContext.Provider value={overrides}>
      {children}
    </LivePreviewContext.Provider>
  );
}
