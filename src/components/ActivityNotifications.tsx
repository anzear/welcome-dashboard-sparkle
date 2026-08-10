import { useEffect, useState } from "react";
import { Bell, FileText, Target, GitBranch, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ACTIVITY_EVENT,
  ActivityNotification,
  clearActivities,
  getActivities,
  markAllRead,
  markRead,
  seedSampleActivities,
} from "@/lib/activityNotifications";

const sourceMeta: Record<ActivityNotification['source'], { label: string; icon: any; color: string }> = {
  'material-brief': { label: 'Material Brief', icon: FileText, color: 'text-blue-500' },
  'decision-space': { label: 'Decision Space', icon: Target, color: 'text-emerald-500' },
  'pathway-decision': { label: 'Pathway Decision', icon: GitBranch, color: 'text-purple-500' },
};

const actionStyle: Record<ActivityNotification['action'], string> = {
  added: 'text-emerald-600',
  updated: 'text-blue-600',
  removed: 'text-red-600',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function ActivityNotifications() {
  const [items, setItems] = useState<ActivityNotification[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    seedSampleActivities();
    const refresh = () => setItems(getActivities());
    refresh();
    window.addEventListener(ACTIVITY_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(ACTIVITY_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const unread = items.filter(i => !i.read).length;

  const onItemClick = (n: ActivityNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 relative bg-card border-border/40 hover:bg-muted/60 rounded-xl"
          aria-label="Activity notifications"
        >
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold leading-none">{unread > 9 ? '9+' : unread}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">Activity</h3>
            <p className="text-xs text-muted-foreground">
              {unread > 0 ? `${unread} unread update${unread !== 1 ? 's' : ''}` : 'You\u2019re all caught up'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { markAllRead(); }} className="text-xs h-7">
                Mark all read
              </Button>
            )}
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => clearActivities()} className="h-7 w-7 p-0" title="Clear all">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground text-center">No activity yet</p>
              <p className="text-xs text-muted-foreground/60 text-center mt-1">
                Changes in Material Briefs and Decision Spaces will show up here
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {items.map(n => {
                const meta = sourceMeta[n.source];
                const Icon = meta.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => onItemClick(n)}
                    className={`w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex gap-2">
                      <div className={`mt-0.5 ${meta.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                            {meta.label}
                          </span>
                          <span className={`text-[9px] font-semibold uppercase ${actionStyle[n.action]}`}>
                            {n.action}
                          </span>
                          {!n.read && <span className="w-1 h-1 rounded-full bg-primary" />}
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">{n.title}</p>
                        {n.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{n.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          {n.topic && (
                            <span className="text-[10px] text-muted-foreground">{n.topic}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(n.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
