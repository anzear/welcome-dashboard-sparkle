import React, { useMemo, useState, useEffect } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import {
  readValidationComments,
  writeValidationComments,
  type ValidationComment,
} from '@/lib/pathwayValidationComments';

type Comment = ValidationComment;

interface Props {
  pathwayId: string;
  topic?: string;
}

const PathwayValidationSpace: React.FC<Props> = ({ pathwayId, topic }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    setComments(readValidationComments(topic, pathwayId));
  }, [topic, pathwayId]);

  /** Single writer: persist and notify other views (Workspace) of the change. */
  const persist = (next: Comment[]) => {
    setComments(next);
    writeValidationComments(topic, pathwayId, next);
  };

  const visible = useMemo(
    () => comments.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [comments]
  );

  const addComment = () => {
    if (!draftText.trim()) return;
    persist([
      ...comments,
      {
        id: crypto.randomUUID(),
        categoryId: '',
        author: 'You',
        text: draftText.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraftText('');
  };

  return (
    <div className="mt-1 flex-1 min-h-0 flex flex-col">
      {/* Unified notes box: existing notes and composer share one container */}
      <div className="rounded-md border border-border bg-card flex flex-col flex-1 min-h-0">
        {/* Note list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          {visible.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <div className="text-xs font-semibold mt-1.5">No notes yet</div>
              <div className="text-[10px] text-muted-foreground mt-1">Post the first note for this pathway.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {visible.map(c => (
                <div key={c.id} className="rounded-lg border border-border/60 bg-background p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-medium text-foreground/70">{c.author}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      {c.metricLabel && (
                        <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[9px] font-medium text-foreground">
                          {c.metricLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground mt-1 whitespace-pre-wrap break-words">{c.text}</p>
                  </div>
                  <button
                    onClick={() => persist(comments.filter(x => x.id !== c.id))}
                    className="text-muted-foreground hover:text-foreground"
                    title="Remove note"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New note composer — bottom of the same box */}
        <div className="px-3 py-2.5 border-t border-border bg-muted/20">
          <Textarea
            value={draftText}
            onChange={e => setDraftText(e.target.value)}
            placeholder="Add your note…"
            className="text-xs min-h-[56px] bg-background"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button size="sm" onClick={addComment} disabled={!draftText.trim()} className="h-7 gap-1 text-xs">
              <Send className="w-3 h-3" /> Post note
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathwayValidationSpace;
