import { useState } from "react";
import { Bell, X, Briefcase, TrendingUp, Users, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CompanyNotification {
  id: string;
  companyName: string;
  type: "partnership" | "funding" | "product" | "expansion";
  message: string;
  timestamp: string;
  read: boolean;
}

// Mock notifications for tracked companies
const mockNotifications: CompanyNotification[] = [
  {
    id: "1",
    companyName: "BioTech Solutions",
    type: "funding",
    message: "Raised $50M Series B funding",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "2",
    companyName: "GreenEnergy Corp",
    type: "partnership",
    message: "Announced strategic partnership with EcoFuels",
    timestamp: "5 hours ago",
    read: false,
  },
  {
    id: "3",
    companyName: "NanoMaterials Inc",
    type: "product",
    message: "Launched new carbon-neutral product line",
    timestamp: "1 day ago",
    read: false,
  },
  {
    id: "4",
    companyName: "SustainTech",
    type: "expansion",
    message: "Expanding operations to 3 new markets",
    timestamp: "2 days ago",
    read: true,
  },
];

const notificationIcons = {
  partnership: Users,
  funding: TrendingUp,
  product: Briefcase,
  expansion: Building2,
};

const notificationColors = {
  partnership: "text-blue-500",
  funding: "text-green-500",
  product: "text-purple-500",
  expansion: "text-orange-500",
};

export function CompanyNotifications() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 relative bg-gradient-to-r from-background to-background/80 border-border/40 hover:from-muted/60 hover:to-muted/40 transition-all duration-300 hover:shadow-sm rounded-xl"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm border border-red-300 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{unreadCount}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-sm">Company Updates</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                No notifications yet
              </p>
              <p className="text-xs text-muted-foreground/60 text-center mt-1">
                Track companies to get notified about their updates
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const iconColor = notificationColors[notification.type];
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 ${iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-semibold text-sm">
                            {notification.companyName}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 hover:bg-muted"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-foreground/80 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
