// Context for the indicator run history panel, kept separate from the components so
// the record history sheet can cross-link to it without an import cycle.
import { createContext, useContext } from "react";

export interface IndicatorRunTarget {
  indicatorId: string;
  indicatorKey: string;
  /** Computed count indicators show run history but expose no review actions. */
  readOnly: boolean;
  /** Record id used to cross-link to the decision history, when one exists. */
  recordId: string | null;
  contextLabel?: string | null;
}
export interface IndicatorRunSheetContextValue {
  target: IndicatorRunTarget | null;
  openRuns: (target: IndicatorRunTarget) => void;
  closeRuns: () => void;
}
export const IndicatorRunSheetContext = createContext<IndicatorRunSheetContextValue | null>(null);
export function useIndicatorRunSheet(): IndicatorRunSheetContextValue {
  const context = useContext(IndicatorRunSheetContext);
  if (!context) throw new Error("useIndicatorRunSheet must be used within IndicatorRunSheetProvider");
  return context;
}
/** Safe for components rendered outside the Data Review provider. */
export function useOptionalIndicatorRunSheet(): IndicatorRunSheetContextValue | null {
  return useContext(IndicatorRunSheetContext);
}
