import { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Lock, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Prototype scope: only these materials have a full intelligence pack.
export const UNLOCKED_TOPICS = ["lactic acid", "fructose"];

export function isTopicUnlocked(topic?: string) {
  if (!topic) return false;
  return UNLOCKED_TOPICS.includes(decodeURIComponent(topic).trim().toLowerCase());
}

export default function IntelligenceGate({ children }: { children: ReactNode }) {
  const { category, topic } = useParams<{ category: string; topic: string }>();
  const navigate = useNavigate();
  const name = topic ? decodeURIComponent(topic) : "This material";

  if (isTopicUnlocked(topic)) return <>{children}</>;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        <button
          onClick={() => navigate("/material-pipeline")}
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-3 h-3" /> Back to portfolio
        </button>

        <div className="rounded-lg border-2 border-dashed border-border bg-card px-8 py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">
            Intelligence pack locked
          </h1>
          <p className="text-base font-semibold text-foreground mb-2">{name}</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            VCG is still building the intelligence layer for this material — value chain, pathways,
            IP, research and market activity become available once the analysis is complete.
            You will be notified in your portfolio when it is ready.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                navigate(
                  `/landscape/${encodeURIComponent(category || "Product")}/${encodeURIComponent(
                    topic || ""
                  )}/material-brief-simple`
                )
              }
            >
              Open material brief
            </Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate("/material-pipeline")}>
              <Sparkles className="w-3 h-3" /> View portfolio
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-6">
            Available in this prototype: Lactic Acid, Fructose.
          </p>
        </div>
      </div>
    </div>
  );
}
