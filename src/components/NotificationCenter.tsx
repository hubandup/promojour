import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const typeIcons: Record<string, string> = {
  warning: "⚠️",
  info: "ℹ️",
  success: "✅",
  error: "❌",
};

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs gap-1">
              <CheckCheck className="w-3.5 h-3.5" />
              Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Aucune notification
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{typeIcons[notif.type] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.read ? "font-semibold" : ""}`}>{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notif.read && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(notif.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notif.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
