import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessages = (pathwayId: string, isTabActive: boolean) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkUnreadMessages = async () => {
      const lastReadKey = `pathway_${pathwayId}_last_read`;
      const lastReadTime = localStorage.getItem(lastReadKey) || new Date(0).toISOString();

      const { data, error } = await supabase
        .from('pathway_chat_messages')
        .select('id')
        .eq('pathway_id', pathwayId)
        .gt('created_at', lastReadTime);

      if (!error && data) {
        setUnreadCount(data.length);
      }
    };

    checkUnreadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`unread-${pathwayId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pathway_chat_messages',
          filter: `pathway_id=eq.${pathwayId}`,
        },
        () => {
          checkUnreadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathwayId]);

  useEffect(() => {
    if (isTabActive) {
      // Mark all messages as read when tab is active
      const lastReadKey = `pathway_${pathwayId}_last_read`;
      localStorage.setItem(lastReadKey, new Date().toISOString());
      setUnreadCount(0);
    }
  }, [isTabActive, pathwayId]);

  return unreadCount;
};
