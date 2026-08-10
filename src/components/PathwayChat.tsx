import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { z } from 'zod';
import userAvatar from '@/assets/user-avatar.png';
import type { User } from '@supabase/supabase-js';

interface ChatMessage {
  id: string;
  user_name: string;
  message: string;
  created_at: string;
  user_id: string;
}

interface PathwayChatProps {
  pathwayId: string;
}

const messageSchema = z.object({
  message: z.string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message must be less than 1000 characters'),
  pathway_id: z.string().min(1, 'Pathway ID is required'),
  user_name: z.string().trim().min(1).max(100),
});

const PathwayChat: React.FC<PathwayChatProps> = ({ pathwayId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up authentication listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch existing messages
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`pathway-chat-${pathwayId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pathway_chat_messages',
          filter: `pathway_id=eq.${pathwayId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathwayId, currentUser]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('pathway_chat_messages')
      .select('*')
      .eq('pathway_id', pathwayId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } else {
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to send messages',
        variant: 'destructive',
      });
      return;
    }

    if (!newMessage.trim()) return;

    setIsLoading(true);

    try {
      // Validate input
      const userName = currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User';
      
      const validated = messageSchema.parse({
        message: newMessage.trim(),
        pathway_id: pathwayId,
        user_name: userName,
      });

      const { error } = await supabase.from('pathway_chat_messages').insert({
        pathway_id: validated.pathway_id,
        user_id: currentUser.id,
        user_name: validated.user_name,
        message: validated.message,
      });

      if (error) {
        throw error;
      }

      setNewMessage('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Validation error',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="border border-border/60 rounded-lg bg-card flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-2 min-h-0" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-semibold mb-1 text-[11px]">No comments yet</p>
              <p className="text-[10px] text-muted-foreground/60">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isOwnMessage = msg.user_id === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-muted text-foreground rounded-bl-sm'
                      }`}
                    >
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`font-semibold text-[10px] ${isOwnMessage ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                          {msg.user_name}
                        </span>
                        <span className={`text-[9px] ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground/60'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-border/60 bg-muted/30 flex-shrink-0">
          <div className="flex gap-2 items-end">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={userAvatar} alt="User" />
              <AvatarFallback>{currentUser?.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentUser ? "Share your insights..." : "Sign in to chat..."}
              className="resize-none text-[11px] border-border focus:border-primary focus:ring-primary/20 rounded-lg bg-card min-h-[32px] h-8"
              rows={1}
              disabled={isLoading || !currentUser}
              maxLength={1000}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading || !currentUser}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 p-0 rounded-lg flex-shrink-0"
              title={currentUser ? "Send message" : "Sign in to send messages"}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PathwayChat;