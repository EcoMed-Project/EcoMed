import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useDeviceNotifications } from "@/hooks/useDeviceNotifications";
import { formatDateTime } from "@/lib/geo";


type Notification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const { userId } = useProfile();
  const queryClient = useQueryClient();
  const { permission, enabled, enable, disable, notify } = useDeviceNotifications();


  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, read, created_at")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const notifyRef = useRef(notify);
  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    if (!userId) return;
    const topic = `notifications-${userId}`;
    // Reaproveitar um canal já inscrito lança erro; removemos qualquer canal antigo antes.
    for (const existing of supabase.getChannels()) {
      if (existing.topic === `realtime:${topic}` || existing.topic === topic) {
        void supabase.removeChannel(existing);
      }
    }
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const item = payload.new as Notification;
          toast(item.title, { description: item.body });
          notifyRef.current(item.title, item.body);
          void queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);



  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  if (!userId) return null;

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-destructive-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificações</p>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="size-4" /> Marcar lidas
            </Button>
          )}
        </div>
        {permission !== "unsupported" && (
          <div className="flex items-start justify-between gap-3 border-b border-border bg-primary-soft/40 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <BellRing className="size-4" /> Avisos no dispositivo
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {permission === "denied"
                  ? "Bloqueado no navegador. Libere as notificações nas configurações do site."
                  : enabled
                    ? "Você recebe alertas de doações e solicitações."
                    : "Receba alertas mesmo com esta aba em segundo plano."}
              </p>
            </div>
            {permission !== "denied" && (
              <Button
                size="sm"
                variant={enabled ? "outline" : "default"}
                onClick={() => (enabled ? disable() : void enable())}
              >
                {enabled ? "Desativar" : "Ativar"}
              </Button>
            )}
          </div>
        )}

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Você ainda não tem notificações.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((item) => (
                <li key={item.id} className={item.read ? "px-4 py-3" : "bg-primary-soft/50 px-4 py-3"}>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{item.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(item.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
