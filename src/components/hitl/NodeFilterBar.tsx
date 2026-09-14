import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHitlStore, type Pathway } from "@/lib/hitlStore";

const clean = (value: string) => value.trim().toLocaleLowerCase();

type NodeFilterValue = {
  feedstock: string;
  product: string;
  isActive: boolean;
  matchesPathway: (pathway: Pathway) => boolean;
  matchingPathwayIds: Set<string>;
  clearFeedstock: () => void;
  clearProduct: () => void;
  clear: () => void;
};

const NodeFilterContext = createContext<NodeFilterValue | null>(null);

export function NodeFilterProvider({ children }: { children: ReactNode }) {
  const store = useHitlStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const feedstock = searchParams.get("feedstock")?.trim() ?? "";
  const product = searchParams.get("product")?.trim() ?? "";
  const update = (key: "feedstock" | "product", value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };
  const clear = () => { const next = new URLSearchParams(searchParams); next.delete("feedstock"); next.delete("product"); setSearchParams(next); };
  const matchesPathway = (pathway: Pathway) => (!feedstock || clean(pathway.feedstock) === clean(feedstock)) && (!product || clean(pathway.product) === clean(product));
  const matchingPathwayIds = useMemo(() => new Set(store.pathways.filter(matchesPathway).map(pathway => pathway.id)), [store.pathways, feedstock, product]);
  const value = { feedstock, product, isActive: Boolean(feedstock || product), matchesPathway, matchingPathwayIds, clearFeedstock: () => update("feedstock", ""), clearProduct: () => update("product", ""), clear };
  return <NodeFilterContext.Provider value={value}>{children}</NodeFilterContext.Provider>;
}

export function useNodeFilter() {
  const value = useContext(NodeFilterContext);
  if (!value) throw new Error("useNodeFilter must be used within NodeFilterProvider");
  return value;
}

export function NodeFilterBar() {
  const store = useHitlStore();
  const filter = useNodeFilter();
  const [searchParams, setSearchParams] = useSearchParams();
  const setValue = (key: "feedstock" | "product", value: string) => { const next = new URLSearchParams(searchParams); if (value === "all") next.delete(key); else next.set(key, value); setSearchParams(next); };
  const feedstocks = useMemo(() => [...new Set(store.pathways.filter(pathway => !filter.product || clean(pathway.product) === clean(filter.product)).map(pathway => pathway.feedstock))].sort((a, b) => a.localeCompare(b)), [store.pathways, filter.product]);
  const products = useMemo(() => [...new Set(store.pathways.filter(pathway => !filter.feedstock || clean(pathway.feedstock) === clean(filter.feedstock)).map(pathway => pathway.product))].sort((a, b) => a.localeCompare(b)), [store.pathways, filter.feedstock]);
  useEffect(() => { if (filter.feedstock && !feedstocks.some(value => clean(value) === clean(filter.feedstock))) filter.clearFeedstock(); }, [filter.feedstock, feedstocks]);
  useEffect(() => { if (filter.product && !products.some(value => clean(value) === clean(filter.product))) filter.clearProduct(); }, [filter.product, products]);
  return <div className="flex flex-wrap items-center justify-between gap-3 border-y bg-muted/20 px-4 py-3">
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filter.feedstock || "all"} onValueChange={value => setValue("feedstock", value)}><SelectTrigger aria-label="Feedstock" className="h-8 w-52 text-[10px]"><SelectValue placeholder="Feedstock" /></SelectTrigger><SelectContent><SelectItem value="all">All Feedstocks</SelectItem>{feedstocks.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      <Select value={filter.product || "all"} onValueChange={value => setValue("product", value)}><SelectTrigger aria-label="Product" className="h-8 w-52 text-[10px]"><SelectValue placeholder="Product" /></SelectTrigger><SelectContent><SelectItem value="all">All Products</SelectItem>{products.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
      {filter.feedstock && <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap pl-2 pr-1 text-xs font-normal">Feedstock: {filter.feedstock}<Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Remove Feedstock filter" onClick={filter.clearFeedstock}><X className="h-3 w-3" /></Button></Badge>}
      {filter.product && <Badge variant="outline" className="inline-flex h-6 items-center gap-1 whitespace-nowrap pl-2 pr-1 text-xs font-normal">Product: {filter.product}<Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Remove Product filter" onClick={filter.clearProduct}><X className="h-3 w-3" /></Button></Badge>}
    </div>
    {filter.isActive && <Button variant="link" size="sm" className="h-7 text-[10px]" onClick={filter.clear}>Clear</Button>}
  </div>;
}

export function NodeFilterEmpty({ rows }: { rows: string }) {
  const { clear } = useNodeFilter();
  return <div className="flex flex-col items-center justify-center gap-2 py-10 text-xs text-muted-foreground"><span>No {rows} for the selected Feedstock / Product</span><Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={clear}>Clear filter</Button></div>;
}