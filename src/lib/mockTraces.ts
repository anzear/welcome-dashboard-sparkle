import type { IndicatorName } from "@/lib/hitlStore";

export type LlmChain = "ChainScout · Keyword Expansion" | "ChainScout · Find" | "ChainScout · Validate" | "ChainScout · Enrich" | "ChainScout · Fit" | "Paper matcher" | "Patent matcher" | `Indicator · ${IndicatorName}` | "Indicator · (dev)";

export interface LlmCall {
  trace_id: string;
  chain: LlmChain;
  model: string;
  prompt_version: string;
  temperature: number;
  called_at: string;
  input_summary: string;
  output_summary: string;
  latency_ms: number;
  token_in: number;
  token_out: number;
  note?: string;
}

const indicators: IndicatorName[] = ["GHG impact", "Yield", "Technology TRL", "Pathway TRL", "Feedstock availability", "Price", "EU market size", "Global market size", "CAGR"];
const hash = (value: string) => [...value].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 2166136261);

function call(trace_id: string, chain: LlmChain, index: number): LlmCall {
  const seed = hash(trace_id);
  return {
    trace_id, chain, model: index % 3 === 0 ? "claude-sonnet-4-6" : "claude-haiku-4-5", prompt_version: `v5.${2 + index % 4}`,
    temperature: chain.startsWith("Indicator") ? 0 : Number((0.1 + (index % 3) * 0.1).toFixed(1)),
    called_at: `2026-09-${String(2 + index % 12).padStart(2, "0")}T${String(8 + index % 8).padStart(2, "0")}:${String(seed % 60).padStart(2, "0")}:00.000Z`,
    input_summary: chain === "Paper matcher" || chain === "Patent matcher" ? "Matched extracted evidence against eligible Pathway nodes." : chain.startsWith("Indicator") ? "Extracted and normalised one sourced Pathway indicator value." : "Evaluated candidate evidence against the four Pathway nodes.",
    output_summary: chain === "ChainScout · Fit" ? "Produced a ranked Pathway candidate for human approval." : "Produced a structured candidate record with evidence and confidence metadata.",
    latency_ms: 620 + seed % 3100, token_in: 780 + seed % 3600, token_out: 180 + seed % 920,
  };
}

const registry = new Map<string, LlmCall>();
const registerRecords = (prefix: string, count: number, chainFor: (index: number) => LlmChain) => {
  for (let index = 0; index < count; index += 1) {
    const id = `${prefix}-${String(index + 1).padStart(3, "0")}`;
    const traceId = `trace-${id}-8f4a91c2`;
    registry.set(traceId, call(traceId, chainFor(index), index));
  }
};
registerRecords("pw", 10, () => "ChainScout · Fit");
registerRecords("co", 8, index => ["ChainScout · Enrich", "ChainScout · Validate"][index % 2] as LlmChain);
registerRecords("pp", 12, index => index % 2 === 0 ? "Paper matcher" : "Patent matcher");
registerRecords("iv", 20, index => `Indicator · ${indicators[index % indicators.length]}`);

const auditEntityChains: LlmChain[] = ["ChainScout · Fit", "ChainScout · Fit", "ChainScout · Fit", "Indicator · Technology TRL", "Indicator · Technology TRL", "ChainScout · Validate", "Patent matcher", "ChainScout · Enrich", "ChainScout · Fit", "Indicator · Feedstock availability", "ChainScout · Validate", "Paper matcher", "ChainScout · Fit", "Indicator · CAGR", "Paper matcher", "Indicator · Yield", "Indicator · Feedstock availability"];
auditEntityChains.forEach((chain, index) => {
  const traceId = `tr_seed${String(index + 1).padStart(3, "0")}91de7c`;
  registry.set(traceId, call(traceId, chain, index));
});

export function getTrace(trace_id: string): LlmCall {
  const known = registry.get(trace_id);
  if (known) return known;
  return { ...call(trace_id, "Indicator · (dev)", hash(trace_id) % 17), note: "synthesised — not in registry" };
}