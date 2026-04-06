"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ViewMode = "PROFILE" | "WORK";

interface ViewContextType {
  viewMode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>("PROFILE");

  const setMode = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <ViewContext.Provider value={{ viewMode, setMode }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useViewContext() {
  const context = useContext(ViewContext);
  if (context === undefined) {
    throw new Error("useViewContext must be used within a ViewProvider");
  }
  return context;
}
