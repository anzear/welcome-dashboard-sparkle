import React, { useMemo, useState, useEffect } from 'react';
import { Sprout, Rocket, FlaskConical, DollarSign, Leaf, Shield, Scale, MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  readValidationComments,
  writeValidationComments,
  type ValidationComment,
} from '@/lib/pathwayValidationComments';

type Status = 'TBD' | 'Go' | 'Uncertain' | 'No-Go';

type Comment = ValidationComment;


const CATEGORIES = [
  { id: 'feedstock', label: 'Feedstock Availability & Security', Icon: Sprout },
  { id: 'technology', label: 'Technology Maturity & Scalability', Icon: Rocket },
  { id: 'material', label: 'Material Conformance', Icon: FlaskConical },
  { id: 'economics', label: 'Economics', Icon: DollarSign },
  { id: 'sustainability', label: 'Sustainability / LCA', Icon: Leaf },
  { id: 'ip', label: 'IP & FTO', Icon: Shield },
  { id: 'regulations', label: 'Regulations', Icon: Scale },
] as const;

const STATUSES: Status[] = ['TBD', 'Go', 'Uncertain', 'No-Go'];

interface Props {
  pathwayId: string;
  topic?: string;
}

const PathwayValidationSpace: React.FC<Props> = ({ pathwayId, topic }) => {
  const statusKey = `pathway-validation-status:${topic || 'default'}:${pathwayId}`;

  const [comments, setComments] = useState<Comment[]>([]);
  const [overallStatus, setOverallStatus] = useState<Status>('TBD');
  const [filter, setFilter] = useState<string>('all');
  const [draftCategory, setDraftCategory] = useState<string>(CATEGORIES[0].id);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    setComments(readValidationComments(topic, pathwayId));
    try {
      const s = localStorage.getItem(statusKey) as Status | null;
      if (s) setOverallStatus(s);
    } catch {}
  }, [topic, pathwayId, statusKey]);

  /** Single writer: persist and notify other views (Research Space) of the change. */
  const persist = (next: Comment[]) => {
    setComments(next);
    writeValidationComments(topic, pathwayId, next);
  };


  useEffect(() => {
    try { localStorage.setItem(statusKey, overallStatus); } catch {}
  }, [overallStatus, statusKey]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of CATEGORIES) map[c.id] = 0;
    for (const c of comments) map[c.categoryId] = (map[c.categoryId] || 0) + 1;
    return map;
  }, [comments]);

  const visible = useMemo(
    () => (filter === 'all' ? comments : comments.filter(c => c.categoryId === filter))
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [comments, filter]
  );

  const addComment = () => {
    if (!draftText.trim()) return;
    setComments(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        categoryId: draftCategory,
        author: 'You',
        text: draftText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraftText('');
  };

  const categoryOf = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

  return (
    <div className="mt-1 flex-1 min-h-0 flex flex-col">
      {/* Header row: guidance + 4-level pathway status */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[560px]">
          Leave comments on this pathway. Tag each comment with one of the seven evaluation categories and filter the
          discussion by category.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pathway Status</span>
          <div className="flex items-center gap-1">
            {STATUSES.map(s => {
              const selected = overallStatus === s;
              const activeCls =
                s === 'Go' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                : s === 'Uncertain' ? 'bg-amber-100 text-amber-700 border-amber-300'
                : s === 'No-Go' ? 'bg-red-100 text-red-700 border-red-300'
                : 'bg-foreground text-background border-foreground';
              return (
                <button
                  key={s}
                  onClick={() => setOverallStatus(s)}
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold border transition-colors ${selected ? activeCls : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'}`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* New comment */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New comment</span>
        </div>
        <Textarea
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          placeholder="Add your comment…"
          className="text-xs min-h-[64px]"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">Tag</span>
            <Select value={draftCategory} onValueChange={setDraftCategory}>
              <SelectTrigger className="h-7 text-xs w-[250px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={addComment} disabled={!draftText.trim()} className="h-7 gap-1 text-xs">
            <Send className="w-3 h-3" /> Post comment
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${filter === 'all' ? 'bg-foreground text-background border-foreground' : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'}`}
        >
          All · {comments.length}
        </button>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold transition-colors ${filter === c.id ? 'bg-foreground text-background border-foreground' : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'}`}
          >
            <c.Icon className="w-3 h-3" />
            <span className="truncate max-w-[180px]">{c.label}</span>
            <span>· {counts[c.id] || 0}</span>
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-8 flex flex-col items-center justify-center text-center">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <div className="text-xs font-semibold mt-1.5">No comments yet</div>
            <div className="text-[10px] text-muted-foreground mt-1">Post the first comment for this pathway.</div>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {visible.map(c => {
              const cat = categoryOf(c.categoryId);
              return (
                <div key={c.id} className="p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        <cat.Icon className="w-3 h-3" />
                        {cat.label}
                      </span>
                      <span className="text-[10px] font-medium text-foreground/70">{c.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground mt-1 whitespace-pre-wrap break-words">{c.text}</p>
                  </div>
                  <button
                    onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))}
                    className="text-muted-foreground hover:text-foreground"
                    title="Remove comment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PathwayValidationSpace;
