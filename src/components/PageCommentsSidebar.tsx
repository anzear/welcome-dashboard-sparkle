import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';
import { useTopicComments } from '@/components/TopicCommentsPopover';
import { supabase } from '@/integrations/supabase/client';


type ReplyPreview = {
  id: string;
  comment_id: string;
  user_name: string;
  message: string;
  created_at: string;
};

const tagColor: Record<string, string> = {
  Setup: 'bg-blue-100 text-blue-700',
  Research: 'bg-purple-100 text-purple-700',
  Shortlisting: 'bg-amber-100 text-amber-700',
  Piloting: 'bg-green-100 text-green-700',
  Decision: 'bg-red-100 text-red-700',
};

const priorityColor: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-600',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const PageCommentsSidebar = () => {
  const ctx = useTopicComments();
  const currentPath = window.location.pathname;
  const [repliesByComment, setRepliesByComment] = useState<Record<string, ReplyPreview[]>>({});
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [postingNew, setPostingNew] = useState(false);

  const comments = ctx?.comments ?? [];
  const pageComments = comments.filter((comment) => comment.page_path === currentPath);
  const pageCommentIds = pageComments.map((comment) => comment.id);
  const pageCommentIdsKey = pageCommentIds.join(',');

  useEffect(() => {
    if (!ctx?.topicKey || pageCommentIds.length === 0) {
      setRepliesByComment({});
      return;
    }

    let isMounted = true;

    const fetchReplies = async () => {
      const { data } = await supabase
        .from('topic_comment_replies')
        .select('id, comment_id, user_name, message, created_at')
        .in('comment_id', pageCommentIds)
        .order('created_at', { ascending: true });

      if (!isMounted) return;

      const grouped = ((data ?? []) as ReplyPreview[]).reduce<Record<string, ReplyPreview[]>>((acc, reply) => {
        acc[reply.comment_id] = [...(acc[reply.comment_id] ?? []), reply];
        return acc;
      }, {});

      setRepliesByComment(grouped);
    };

    fetchReplies();

    const channel = supabase
      .channel(`page-comment-replies-${currentPath}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'topic_comment_replies' },
        (payload) => {
          const replyCommentId =
            ((payload.new as { comment_id?: string } | null)?.comment_id) ||
            ((payload.old as { comment_id?: string } | null)?.comment_id);

          if (replyCommentId && pageCommentIds.includes(replyCommentId)) {
            fetchReplies();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [ctx?.topicKey, currentPath, pageCommentIdsKey]);

  if (!ctx || !ctx.topicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="w-6 h-6 text-muted-foreground/40 mb-2" />
        <p className="text-[10px] font-medium text-muted-foreground">No active topic</p>
      </div>
    );
  }

  const handleSendReply = async (commentId: string) => {
    if (!replyText.trim() || sendingReply) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    if (!currentUser) return;

    setSendingReply(true);
    const userName = currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User';

    const { error } = await supabase.from('topic_comment_replies').insert({
      comment_id: commentId,
      user_id: currentUser.id,
      user_name: userName,
      message: replyText.trim(),
    });

    setSendingReply(false);
    if (!error) setReplyText('');
  };

  const handlePostGeneralComment = async () => {
    if (!newCommentText.trim() || postingNew || !ctx?.topicKey) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const currentUser = session?.user ?? null;
    const userId = currentUser?.id || '00000000-0000-0000-0000-000000000000';
    const userName = currentUser?.user_metadata?.display_name || currentUser?.email?.split('@')[0] || 'Jon Goriup';

    setPostingNew(true);
    const { error } = await supabase.from('topic_comments').insert({
      topic_key: ctx.topicKey,
      page_path: currentPath,
      user_id: userId,
      user_name: userName,
      message: newCommentText.trim(),
      title: '',
      function_tag: 'Setup',
      owner: '',
      priority: 'Medium',
      due_date: null,
      analysis_context: '',
      x_percent: -1,
      y_percent: -1,
      resolved: false,
    });

    setPostingNew(false);
    if (!error) {
      setNewCommentText('');
      ctx.fetchComments();
    }
  };

  const composer = (
    <div className="rounded-lg border border-border/60 bg-card p-2 space-y-1.5">
      <textarea
        value={newCommentText}
        onChange={(e) => setNewCommentText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handlePostGeneralComment();
          }
        }}
        placeholder="Add a general comment about this page..."
        rows={2}
        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
      />
      <div className="flex justify-end">
        <button
          onClick={handlePostGeneralComment}
          disabled={!newCommentText.trim() || postingNew}
          className="rounded-md bg-primary px-2.5 py-1 text-[9px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
        >
          {postingNew ? 'Posting...' : 'Post comment'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {pageComments.length === 0 ? (
        <>
          <div className="rounded-lg border border-border/40 bg-card px-4 py-6 text-center">
            <p className="text-[10px] text-muted-foreground">No comments on this page yet</p>
            <p className="text-[9px] text-muted-foreground/60 mt-1">Add one below, or use the "Comment" button in the top bar to pin to a specific spot</p>
          </div>
          {composer}
        </>
      ) : (
        <>
        <div className="space-y-1.5">
          {pageComments.map((comment) => {
            const replies = repliesByComment[comment.id] ?? [];
            const isExpanded = expandedCommentId === comment.id;

            return (
              <div
                key={comment.id}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all cursor-pointer ${
                  ctx.hoveredCommentId === comment.id
                    ? 'border-success ring-2 ring-success/40 bg-success/10 shadow-md'
                    : isExpanded
                      ? 'border-primary/50 bg-card shadow-sm'
                      : 'border-border/60 bg-card hover:border-primary/40'
                }`}
                onMouseEnter={() => ctx.setHoveredCommentId(comment.id)}
                onMouseLeave={() => ctx.setHoveredCommentId(null)}
                onClick={() => {
                  if (isExpanded) {
                    setExpandedCommentId(null);
                    setReplyText('');
                  } else {
                    setExpandedCommentId(comment.id);
                    setReplyText('');
                  }
                }}
              >
                <div className="mb-1.5">
                  <p className="text-[10px] font-medium text-foreground leading-snug break-words">
                    {comment.message || comment.title || 'Untitled'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1 mb-1 text-[7px] text-muted-foreground">
                  <span className="font-medium">Stage</span>
                  <Badge variant="secondary" className={`text-[7px] px-1 py-0 h-3 ${tagColor[comment.function_tag] || ''}`}>
                    {comment.function_tag}
                  </Badge>
                  <span className="font-medium ml-1">Priority</span>
                  <Badge variant="secondary" className={`text-[7px] px-1 py-0 h-3 ${priorityColor[comment.priority] || ''}`}>
                    {comment.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
                  <span>{comment.user_name}</span>
                  <span>·</span>
                  <span>{formatTime(comment.created_at)}</span>
                  {replies.length > 0 && !isExpanded && (
                    <>
                      <span>·</span>
                      <span className="text-primary font-medium">{replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
                    </>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-2 border-t border-border/40 pt-2" onClick={(e) => e.stopPropagation()}>
                    {replies.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {replies.map((reply) => (
                          <div key={reply.id} className="rounded-md bg-muted/40 px-2 py-1.5">
                            <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mb-0.5">
                              <span className="font-semibold text-foreground">{reply.user_name}</span>
                              <span>·</span>
                              <span>{formatTime(reply.created_at)}</span>
                            </div>
                            <p className="text-[9px] text-foreground leading-snug break-words">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply(comment.id);
                          }
                        }}
                        placeholder="Reply..."
                        className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-[9px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <button
                        onClick={() => handleSendReply(comment.id)}
                        disabled={!replyText.trim() || sendingReply}
                        className="rounded-md bg-primary px-2 py-1 text-[8px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {composer}
        </>
      )}
    </div>
  );
};

export default PageCommentsSidebar;
