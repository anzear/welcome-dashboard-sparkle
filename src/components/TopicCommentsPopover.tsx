import React, { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MessageSquarePlus, ClipboardList, Send, X, MapPin, Calendar, MessageCircle, ChevronRight, AlertTriangle, AlertCircle, ArrowDown, ArrowUp, Flame, Tag, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

const FUNCTION_TAGS = ['Setup', 'Research', 'Shortlisting', 'Piloting', 'Decision'] as const;
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

type FunctionTag = typeof FUNCTION_TAGS[number];
type Priority = typeof PRIORITIES[number];

interface TopicComment {
  id: string;
  topic_key: string;
  page_path: string;
  user_id: string;
  user_name: string;
  message: string;
  title: string;
  function_tag: string;
  owner: string;
  priority: string;
  due_date: string | null;
  analysis_context: string;
  x_percent: number;
  y_percent: number;
  resolved: boolean;
  created_at: string;
}

interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

interface CommentsContextType {
  commentMode: boolean;
  setCommentMode: (v: boolean) => void;
  comments: TopicComment[];
  pendingPin: { x: number; y: number } | null;
  setPendingPin: (v: { x: number; y: number } | null) => void;
  currentUser: User | null;
  topicKey: string | null;
  topic: string | null;
  selectedComment: TopicComment | null;
  setSelectedComment: (c: TopicComment | null) => void;
  fetchComments: () => void;
  pinsVisible: boolean;
  setPinsVisible: (v: boolean) => void;
  hoveredCommentId: string | null;
  setHoveredCommentId: (id: string | null) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CommentsContext = createContext<CommentsContextType | null>(null);
export const useTopicComments = () => useContext(CommentsContext);

// ─── Provider ────────────────────────────────────────────────────────────────

export const TopicCommentsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const match = location.pathname.match(/\/landscape\/([^/]+)\/([^/]+)/);
  const category = match ? decodeURIComponent(match[1]) : null;
  const topic = match ? decodeURIComponent(match[2]) : null;
  const topicKey = category && topic ? `${category}/${topic}` : null;

  const [comments, setComments] = useState<TopicComment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [commentMode, setCommentMode] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [selectedComment, setSelectedComment] = useState<TopicComment | null>(null);
  const [pinsVisible, setPinsVisible] = useState(false);
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  useEffect(() => {
    setCommentMode(false);
    setPendingPin(null);
    setSelectedComment(null);
    setPinsVisible(false);
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setCurrentUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setCurrentUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const fetchComments = async () => {
    if (!topicKey) return;
    const { data } = await supabase
      .from('topic_comments')
      .select('*')
      .eq('topic_key', topicKey)
      .order('created_at', { ascending: false });
    if (data) setComments(data as TopicComment[]);
  };

  useEffect(() => {
    if (!topicKey) return;
    fetchComments();
    const channel = supabase
      .channel(`topic-comments-${topicKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_comments' }, () => fetchComments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [topicKey]);

  useEffect(() => {
    if (!commentMode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') { setCommentMode(false); setPendingPin(null); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [commentMode]);

  return (
    <CommentsContext.Provider value={{
      commentMode, setCommentMode, comments, pendingPin, setPendingPin,
      currentUser, topicKey, topic, selectedComment, setSelectedComment, fetchComments,
      pinsVisible, setPinsVisible,
      hoveredCommentId, setHoveredCommentId,
    }}>
      {children}
    </CommentsContext.Provider>
  );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatTime = (ts: string) => {
  const d = new Date(ts), now = new Date();
  const m = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const getPageLabel = (path: string) => {
  if (path.includes('/pathways/')) return 'Pathway Profile';
  if (path.includes('/pathways')) return 'Pathway Explorer';
  if (path.includes('/market-activity')) return 'Market Players';
  if (path.includes('/patents')) return 'IP Landscape';
  if (path.includes('/publications')) return 'Research Landscape';
  if (path.includes('/value-chain')) return 'Executive Summary';
  return 'Page';
};

const tagColor: Record<string, string> = {
  Setup: 'bg-blue-100 text-blue-700',
  Research: 'bg-purple-100 text-purple-700',
  Shortlisting: 'bg-amber-100 text-amber-700',
  Piloting: 'bg-teal-100 text-teal-700',
  Decision: 'bg-emerald-100 text-emerald-700',
};

const priorityIcon: Record<string, React.ReactNode> = {
  Low: <ArrowDown className="w-3 h-3 text-muted-foreground" />,
  Medium: <AlertCircle className="w-3 h-3 text-blue-500" />,
  High: <ArrowUp className="w-3 h-3 text-orange-500" />,
  Critical: <Flame className="w-3 h-3 text-red-500" />,
};

const priorityColor: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-blue-50 text-blue-600',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

// ─── Comment Creation Form (shown at pin location) ──────────────────────────

const CommentCreationForm = ({ pin, onClose }: { pin: { x: number; y: number }; onClose: () => void }) => {
  const ctx = useTopicComments()!;
  const location = useLocation();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [functionTag, setFunctionTag] = useState<FunctionTag | ''>('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !ctx.topicKey) return;
    setIsLoading(true);
    try {
      const userId = ctx.currentUser?.id || GUEST_USER_ID;
      const userName = ctx.currentUser?.user_metadata?.display_name || ctx.currentUser?.email?.split('@')[0] || 'Jon Goriup';
      const { error } = await supabase.from('topic_comments').insert({
        topic_key: ctx.topicKey,
        page_path: location.pathname,
        user_id: userId,
        user_name: userName,
        message: message.trim(),
        title: title.trim() || 'Comment',
        function_tag: functionTag || 'Setup',
        owner: owner.trim() || userName,
        priority: priority || 'Medium',
        due_date: dueDate || null,
        analysis_context: getPageLabel(location.pathname),
        x_percent: pin.x,
        y_percent: pin.y,
      });
      if (error) throw error;
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="absolute z-[80]"
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-6 h-6 -ml-3 -mt-3 rounded-full bg-success text-white flex items-center justify-center shadow-md">
        <MapPin className="w-3.5 h-3.5" />
      </div>
      <div className="absolute left-8 top-0 bg-card border border-border/60 rounded-xl shadow-2xl w-[400px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
              <MessageSquarePlus className="w-3 h-3 text-success" />
            </div>
            <h4 className="text-xs font-semibold text-foreground">New Comment</h4>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-3.5 space-y-2.5">

          {/* Comment body */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the comment *"
            className="resize-none !text-xs border-border/40 rounded-lg bg-muted/30 focus:bg-background min-h-[52px] transition-colors"
            rows={2}
            maxLength={1000}
          />

          {/* Meta row: Stage + Priority */}
          <div className="flex gap-2">
            <Select value={functionTag || undefined} onValueChange={(v) => setFunctionTag(v as FunctionTag)}>
              <SelectTrigger className={`h-7 text-xs flex-1 rounded-lg border-border/40 ${functionTag ? tagColor[functionTag] || '' : ''}`}>
                <Tag className="w-3 h-3 mr-1.5 opacity-60" />
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {FUNCTION_TAGS.map(t => (
                  <SelectItem key={t} value={t} className="text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${tagColor[t]}`}>{t}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority || undefined} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className={`h-7 text-xs flex-1 rounded-lg border-border/40 ${priority ? priorityColor[priority] || '' : ''}`}>
                {priority ? priorityIcon[priority] : <AlertCircle className="w-3 h-3 opacity-40" />}
                <span className="ml-1"><SelectValue placeholder="Priority" /></span>
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map(p => (
                  <SelectItem key={p} value={p} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      {priorityIcon[p]}
                      {p}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-1.5 border-t border-border/30">
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="h-7 text-xs px-3 rounded-lg" onClick={onClose}>Cancel</Button>
              <Button
                size="sm"
                className="h-7 text-xs px-3 rounded-lg bg-success hover:bg-success/90 text-white shadow-sm"
                onClick={handleSubmit}
                disabled={!message.trim() || isLoading}
              >
                <Send className="w-3 h-3 mr-1" /> Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Comment Thread (replies) ───────────────────────────────────────────────

const CommentThread = ({ comment, onClose }: { comment: TopicComment; onClose: () => void }) => {
  const ctx = useTopicComments()!;
  const { toast } = useToast();
  const [replies, setReplies] = useState<CommentReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchReplies = async () => {
    const { data } = await supabase
      .from('topic_comment_replies')
      .select('*')
      .eq('comment_id', comment.id)
      .order('created_at', { ascending: true });
    if (data) setReplies(data as CommentReply[]);
  };

  useEffect(() => {
    fetchReplies();
    const channel = supabase
      .channel(`replies-${comment.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'topic_comment_replies', filter: `comment_id=eq.${comment.id}` }, () => fetchReplies())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comment.id]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const userId = ctx.currentUser?.id || GUEST_USER_ID;
      const userName = ctx.currentUser?.user_metadata?.display_name || ctx.currentUser?.email?.split('@')[0] || 'Jon Goriup';
      const { error } = await supabase.from('topic_comment_replies').insert({
        comment_id: comment.id,
        user_id: userId,
        user_name: userName,
        message: replyText.trim(),
      });
      if (error) throw error;
      setReplyText('');
    } catch {
      toast({ title: 'Error', description: 'Failed to send reply', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const anchorEl = typeof document !== 'undefined'
    ? document.querySelector('[data-comments-content-inner]') as HTMLElement | null
    : null;
  const anchorRect = anchorEl?.getBoundingClientRect();
  const threadStyle = anchorRect && typeof window !== 'undefined'
    ? {
        left: `${Math.min(anchorRect.left + (anchorRect.width * comment.x_percent) / 100 + 24, window.innerWidth - 340)}px`,
        top: `${anchorRect.top + (anchorRect.height * comment.y_percent) / 100}px`,
      }
    : {
        left: `min(${comment.x_percent}% + 24px, calc(100% - 340px))`,
        top: `${comment.y_percent}%`,
      };

  return (
    <div className="fixed inset-0 z-[65] bg-black/10" onClick={onClose}>
      <div
        className="absolute bg-card border border-border rounded-lg shadow-2xl w-80 max-h-[480px] flex flex-col z-[70]"
        style={threadStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold text-foreground truncate flex-1">{comment.title}</h4>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-2"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex flex-wrap gap-1 mb-1.5">
            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${tagColor[comment.function_tag] || ''}`}>{comment.function_tag}</Badge>
            <Badge variant="secondary" className={`text-[9px] px-1.5 py-0 h-4 ${priorityColor[comment.priority] || ''}`}>{comment.priority}</Badge>
            {comment.due_date && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                <Calendar className="w-2.5 h-2.5 mr-0.5" />{new Date(comment.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span>By <strong>{comment.user_name}</strong></span>
            <span>·</span>
            <span>Owner: <strong>{comment.owner}</strong></span>
            <span>·</span>
            <span>{comment.analysis_context}</span>
          </div>
        </div>

        {/* Original message */}
        <div className="px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0">
          <p className="text-xs text-foreground leading-snug">{comment.message}</p>
          <span className="text-[9px] text-muted-foreground">{formatTime(comment.created_at)}</span>
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
          {replies.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-3">No replies yet — start the discussion</p>
          ) : (
            <div className="space-y-2">
              {replies.map(r => (
                <div key={r.id} className={`flex ${r.user_id === ctx.currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${
                    r.user_id === ctx.currentUser?.id
                      ? 'bg-success text-white rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className={`font-semibold text-[9px] ${r.user_id === ctx.currentUser?.id ? 'text-white/90' : 'text-muted-foreground'}`}>{r.user_name}</span>
                      <span className={`text-[8px] ${r.user_id === ctx.currentUser?.id ? 'text-white/60' : 'text-muted-foreground/60'}`}>{formatTime(r.created_at)}</span>
                    </div>
                    <p className="text-[10px] leading-snug whitespace-pre-wrap break-words">{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reply input */}
        <div className="px-2 py-2 border-t border-border flex-shrink-0">
          <div className="flex gap-1 items-end">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
              placeholder="Reply..."
              className="resize-none text-xs border-border rounded-lg bg-background min-h-[28px] h-7"
              rows={1}
              maxLength={500}
              disabled={sending || !ctx.currentUser}
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyText.trim() || sending || !ctx.currentUser}
              className="bg-success hover:bg-success/90 text-white h-7 w-7 p-0 rounded-lg flex-shrink-0"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Header Buttons ─────────────────────────────────────────────────────────

export const TopicCommentsHeaderButtons = () => {
  const ctx = useTopicComments();
  const [logOpen, setLogOpen] = useState(false);

  if (!ctx || !ctx.topicKey) return null;

  const { commentMode, setCommentMode, setPendingPin, comments, topic, setSelectedComment } = ctx;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant={commentMode ? 'default' : 'ghost'}
        size="sm"
        className={`relative h-8 px-2 gap-1.5 ${commentMode ? 'bg-success hover:bg-success/90 text-white' : 'text-muted-foreground hover:text-foreground'}`}
        onClick={() => { setCommentMode(!commentMode); setPendingPin(null); }}
        title={commentMode ? 'Cancel comment mode' : 'Add a comment'}
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span className="text-[10px] font-medium">Pin a Comment</span>
      </Button>

      <Popover open={logOpen} onOpenChange={setLogOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground" title="View all comments">
            <ClipboardList className="w-4 h-4" />
            <span className="text-[10px] font-medium">Log</span>
            {comments.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-success text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {comments.length > 9 ? '9+' : comments.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0" sideOffset={8}>
          <div className="flex flex-col max-h-[450px]">
            <div className="px-3 py-2 border-b border-border">
              <h4 className="text-xs font-bold text-foreground">All Comments</h4>
              <p className="text-[10px] text-muted-foreground">{topic} — {comments.length} comment{comments.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MessageSquarePlus className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">No comments yet</p>
                  <p className="text-[10px] text-muted-foreground">Click the comment icon, then click anywhere on the page</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {comments.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors"
                      onClick={() => { setLogOpen(false); setSelectedComment(c); }}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-foreground truncate">{c.title || 'Untitled'}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1">
                        <Badge variant="secondary" className={`text-[8px] px-1 py-0 h-3.5 ${tagColor[c.function_tag] || ''}`}>{c.function_tag}</Badge>
                        <Badge variant="secondary" className={`text-[8px] px-1 py-0 h-3.5 ${priorityColor[c.priority] || ''}`}>{c.priority}</Badge>
                        <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5">{c.analysis_context || getPageLabel(c.page_path)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span>{c.user_name}</span>
                        <span>·</span>
                        <span>Owner: {c.owner}</span>
                        <span>·</span>
                        <span>{formatTime(c.created_at)}</span>
                        {c.due_date && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{new Date(c.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{c.message}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ─── Content Layer (pins + overlays inside scrollable area) ─────────────────

export const TopicCommentsContentLayer = () => {
  const ctx = useTopicComments();
  const location = useLocation();

  if (!ctx || !ctx.topicKey) return null;

  const { commentMode, comments, pendingPin, setPendingPin, selectedComment, setSelectedComment, pinsVisible, hoveredCommentId, setHoveredCommentId } = ctx;
  const pageComments = comments.filter(
    c => c.page_path === location.pathname && c.x_percent >= 0 && c.y_percent >= 0
  );
  const showPins = pinsVisible || commentMode;

  const anchorEl = typeof document !== 'undefined'
    ? document.querySelector('[data-comments-content-inner]') as HTMLElement | null
    : null;

  const pinLayer = (
    <>
      {commentMode && pendingPin && (
        <CommentCreationForm pin={pendingPin} onClose={() => { setPendingPin(null); ctx.setCommentMode(false); }} />
      )}

      {showPins && pageComments.map((comment) => {
        const isHighlighted = hoveredCommentId === comment.id;
        return (
          <button
            key={comment.id}
            className="absolute z-[55]"
            style={{ left: `${comment.x_percent}%`, top: `${comment.y_percent}%` }}
            onClick={(e) => { e.stopPropagation(); setSelectedComment(selectedComment?.id === comment.id ? null : comment); }}
            onMouseEnter={() => setHoveredCommentId(comment.id)}
            onMouseLeave={() => setHoveredCommentId(null)}
          >
            <div
              className={`relative flex items-center justify-center w-6 h-6 -ml-3 -mt-3 rounded-full text-white shadow-md transition-all ${
                isHighlighted
                  ? 'bg-success scale-125 ring-2 ring-success/40 ring-offset-2 ring-offset-background'
                  : 'bg-success hover:scale-110'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
            </div>
          </button>
        );
      })}
    </>
  );

  return (
    <>
      {/* Comment mode banner */}
      {commentMode && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[70] pointer-events-none">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/30 text-foreground/90 px-6 py-2.5 rounded-xl flex items-center gap-2.5 text-xs font-medium pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-white/10">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            Click anywhere to place a comment
            <button onClick={() => { ctx.setCommentMode(false); setPendingPin(null); }} className="ml-1 hover:bg-white/20 rounded-md p-0.5 transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {anchorEl ? createPortal(pinLayer, anchorEl) : pinLayer}

      {/* Thread detail panel */}
      {selectedComment && (
        <CommentThread comment={selectedComment} onClose={() => setSelectedComment(null)} />
      )}
    </>
  );
};

const TopicCommentsSystem = TopicCommentsHeaderButtons;
export default TopicCommentsSystem;
