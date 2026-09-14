import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface TraceSheetContextValue { traceId: string | null; openTrace: (traceId: string) => void; closeTrace: () => void; }
const TraceSheetContext = createContext<TraceSheetContextValue | null>(null);

export function TraceSheetProvider({ children }: { children: ReactNode }) {
  const [traceId, setTraceId] = useState<string | null>(null);
  const value = useMemo(() => ({ traceId, openTrace: setTraceId, closeTrace: () => setTraceId(null) }), [traceId]);
  return <TraceSheetContext.Provider value={value}>{children}</TraceSheetContext.Provider>;
}

export function useTraceSheet() {
  const context = useContext(TraceSheetContext);
  if (!context) throw new Error("useTraceSheet must be used within TraceSheetProvider");
  return context;
}