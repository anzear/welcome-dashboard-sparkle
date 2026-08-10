import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks the number of new comments + replies for the current page
 * since the user last viewed the comments tab.
 *
 * Uses localStorage to persist the "last seen" timestamp per page path.
 */
export const usePageCommentsUnread = (
  topicKey: string | null | undefined,
  pagePath: string,
  isTabActive: boolean,
) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const storageKey = `page_comments_last_read::${topicKey || 'none'}::${pagePath}`;

  useEffect(() => {
    if (!topicKey) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const recompute = async () => {
      const lastRead = localStorage.getItem(storageKey) || new Date(0).toISOString();

      // 1. New comments on this page since lastRead
      const { data: comments } = await supabase
        .from('topic_comments')
        .select('id, created_at')
        .eq('topic_key', topicKey)
        .eq('page_path', pagePath)
        .gt('created_at', lastRead);

      // Also check replies on any of THIS page's comments
      const { data: allPageComments } = await supabase
        .from('topic_comments')
        .select('id')
        .eq('topic_key', topicKey)
        .eq('page_path', pagePath);

      const ids = (allPageComments ?? []).map((c) => c.id);
      let replyCount = 0;
      if (ids.length > 0) {
        const { data: replies } = await supabase
          .from('topic_comment_replies')
          .select('id')
          .in('comment_id', ids)
          .gt('created_at', lastRead);
        replyCount = replies?.length ?? 0;
      }

      if (!isMounted) return;
      setUnreadCount((comments?.length ?? 0) + replyCount);
    };

    recompute();

    const channel = supabase
      .channel(`page-comments-unread-${pagePath}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'topic_comments' },
        () => recompute(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'topic_comment_replies' },
        () => recompute(),
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [topicKey, pagePath, storageKey]);

  // Mark as read when the comments tab becomes active
  useEffect(() => {
    if (isTabActive && topicKey) {
      localStorage.setItem(storageKey, new Date().toISOString());
      setUnreadCount(0);
    }
  }, [isTabActive, topicKey, storageKey]);

  return unreadCount;
};
