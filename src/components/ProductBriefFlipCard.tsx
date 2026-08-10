import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowRightLeft, Check, FileText, Plus, RotateCcw, Save, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProductBrief {
  materialSpec: string;
  constraints: string;
  priorities: string[];
  customPriorities: string[];
  status: string;
  notes: string;
}

interface ProductBriefFlipCardProps {
  category?: string;
  description: string;
  isFeedstockRoute: boolean;
  productName: string;
  topicKey: string;
}

const PRIORITY_OPTIONS = [
  'Decarbonization',
  'Supply Diversification',
  'Cost Reduction',
  'Circular Economy',
  'Bio-based Transition',
  'Regulatory Compliance',
  'Performance Improvement',
  'Waste Valorisation',
];

const STATUS_OPTIONS = [
  'Scoping',
  'Under Review',
  'Active Evaluation',
  'Pilot Planning',
  'On Hold',
  'Completed',
];

const emptyBrief: ProductBrief = {
  materialSpec: '',
  constraints: '',
  priorities: [],
  customPriorities: [],
  status: 'Scoping',
  notes: '',
};

const ProductBriefFlipCard: React.FC<ProductBriefFlipCardProps> = ({
  category,
  description,
  isFeedstockRoute,
  productName,
  topicKey,
}) => {
  const storageKey = `product-brief-${topicKey}`;
  const [isFlipped, setIsFlipped] = useState(false);
  const [brief, setBrief] = useState<ProductBrief>(emptyBrief);
  const [newPriority, setNewPriority] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBrief({ ...emptyBrief, ...parsed, customPriorities: parsed.customPriorities || [] });
      } catch {
        setBrief(emptyBrief);
      }
    } else {
      setBrief(emptyBrief);
    }
  }, [storageKey]);

  const allPriorities = useMemo(
    () => [...PRIORITY_OPTIONS, ...brief.customPriorities],
    [brief.customPriorities]
  );

  const selectedPriorities = brief.priorities.slice(0, 3);

  const togglePriority = (priority: string) => {
    setBrief((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((item) => item !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const addCustomPriority = () => {
    const trimmed = newPriority.trim();
    if (!trimmed) return;
    if (brief.customPriorities.includes(trimmed) || PRIORITY_OPTIONS.includes(trimmed)) {
      setNewPriority('');
      setShowOtherInput(false);
      return;
    }

    setBrief((prev) => ({
      ...prev,
      customPriorities: [...prev.customPriorities, trimmed],
      priorities: [...prev.priorities, trimmed],
    }));
    setNewPriority('');
    setShowOtherInput(false);
  };

  const removeCustomPriority = (priority: string) => {
    setBrief((prev) => ({
      ...prev,
      customPriorities: prev.customPriorities.filter((item) => item !== priority),
      priorities: prev.priorities.filter((item) => item !== priority),
    }));
  };

  const handleSave = () => {
    localStorage.setItem(storageKey, JSON.stringify(brief));
    toast.success('Material brief saved');
    setIsFlipped(false);
  };

  return (
    <div className="[perspective:1600px] min-h-[340px] lg:min-h-[360px]">
      <div
        className={cn(
          'relative h-full min-h-[340px] lg:min-h-[360px] w-full transition-transform duration-700 [transform-style:preserve-3d]',
          isFlipped && '[transform:rotateY(180deg)]'
        )}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="h-full rounded-[24px] border border-border/70 bg-card shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.25)] overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_35%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.35))]" />
            <div className="relative flex h-full flex-col justify-between p-6 lg:p-7">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-bold tracking-[0.18em] px-3 py-1 rounded-full">
                    {category || (isFeedstockRoute ? 'Feedstock' : 'Product')}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-medium px-2.5 py-1 rounded-full text-muted-foreground border-border/70 bg-background/80">
                    Chemical
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-medium px-2.5 py-1 rounded-full text-muted-foreground border-border/70 bg-background/80">
                    Organic Acid
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl lg:text-[2.6rem] leading-none font-semibold tracking-tight text-foreground">
                    {productName}
                  </h1>
                  <p className="max-w-xl text-[15px] leading-8 text-muted-foreground">
                    {description}
                  </p>
                </div>
              </div>

              <div className="relative mt-6 rounded-2xl border border-border/60 bg-background/85 p-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      Material Brief
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-foreground">
                        Status: {brief.status}
                      </Badge>
                      {selectedPriorities.length > 0 ? (
                        selectedPriorities.map((priority) => (
                          <Badge key={priority} variant="outline" className="rounded-full border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {priority}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="rounded-full border-dashed border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          No priorities yet
                        </Badge>
                      )}
                    </div>
                    <p className="max-w-md text-[12px] leading-5 text-muted-foreground">
                      {brief.materialSpec || 'Add the exact product specifications, constraints, timing, and internal priorities for this opportunity.'}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="default"
                    className="h-10 rounded-xl px-4 text-sm font-medium shadow-sm"
                    onClick={() => setIsFlipped(true)}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Add details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <div className="h-full rounded-[24px] border border-border/70 bg-card shadow-[0_20px_60px_-30px_hsl(var(--foreground)/0.25)] overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]" />
            <div className="relative flex h-full flex-col p-5 lg:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Material Brief Details
                  </div>
                  <p className="mt-1 text-sm text-foreground">Capture the exact requirements right inside the hero card.</p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => {
                    setIsFlipped(false);
                    setShowOtherInput(false);
                    setNewPriority('');
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3 min-h-0">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Status</Label>
                    <Select value={brief.status} onValueChange={(value) => setBrief((prev) => ({ ...prev, status: value }))}>
                      <SelectTrigger className="h-9 rounded-xl bg-background/85 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status} className="text-sm">
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Material Specification</Label>
                    <Textarea
                      placeholder="e.g. L-Lactic Acid ≥99% optical purity, food grade, low residual sugar..."
                      value={brief.materialSpec}
                      onChange={(event) => setBrief((prev) => ({ ...prev, materialSpec: event.target.value }))}
                      className="min-h-[92px] rounded-xl bg-background/85 text-sm leading-6"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Constraints</Label>
                    <Textarea
                      placeholder="e.g. Cost ceiling $1,200/ton, target timing 2029, performance requirement >180°C, EU REACH compliant..."
                      value={brief.constraints}
                      onChange={(event) => setBrief((prev) => ({ ...prev, constraints: event.target.value }))}
                      className="min-h-[112px] rounded-xl bg-background/85 text-sm leading-6"
                    />
                  </div>
                </div>

                <div className="flex min-h-0 flex-col gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Internal Priorities</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {allPriorities.map((priority) => {
                        const isCustom = brief.customPriorities.includes(priority);
                        const isSelected = brief.priorities.includes(priority);

                        return (
                          <Badge
                            key={priority}
                            variant={isSelected ? 'default' : 'outline'}
                            className={cn(
                              'h-6 cursor-pointer rounded-full px-2.5 text-[10px] font-medium transition-all',
                              isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            )}
                            onClick={() => togglePriority(priority)}
                          >
                            {priority}
                            {isCustom && (
                              <X
                                className="ml-1 h-3 w-3 opacity-70 hover:opacity-100"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeCustomPriority(priority);
                                }}
                              />
                            )}
                          </Badge>
                        );
                      })}

                      {!showOtherInput ? (
                        <Badge
                          variant="outline"
                          className="h-6 cursor-pointer rounded-full border-dashed px-2.5 text-[10px] font-medium hover:bg-muted"
                          onClick={() => setShowOtherInput(true)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Other
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full border border-border bg-background px-1.5 py-1">
                          <Input
                            autoFocus
                            placeholder="Type priority..."
                            value={newPriority}
                            onChange={(event) => setNewPriority(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') addCustomPriority();
                              if (event.key === 'Escape') {
                                setShowOtherInput(false);
                                setNewPriority('');
                              }
                            }}
                            className="h-6 w-28 border-0 bg-transparent px-1 text-[10px] shadow-none focus-visible:ring-0"
                          />
                          <button
                            type="button"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                            onClick={addCustomPriority}
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1 min-h-0">
                    <Label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Notes</Label>
                    <Textarea
                      placeholder="Any additional context, references, or considerations..."
                      value={brief.notes}
                      onChange={(event) => setBrief((prev) => ({ ...prev, notes: event.target.value }))}
                      className="min-h-[150px] h-full rounded-xl bg-background/85 text-sm leading-6"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                    <p className="text-[11px] text-muted-foreground">Saved locally for this topic.</p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" className="h-9 rounded-xl px-3 text-xs" onClick={() => setIsFlipped(false)}>
                        Cancel
                      </Button>
                      <Button type="button" className="h-9 rounded-xl px-4 text-xs" onClick={handleSave}>
                        <Save className="h-3.5 w-3.5" />
                        Save brief
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBriefFlipCard;
