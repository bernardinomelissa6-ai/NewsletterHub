"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Star, Shield, RotateCcw, X, Award } from "lucide-react";

type NotificationType =
  | "COMPLIMENT_APPROVED"
  | "COMPLIMENT_REJECTED"
  | "COMPLIMENT_RETURNED"
  | "COMPLIMENT_EVALUATED"
  | "COMPLIMENT_REEVALUATED"
  | "NEW_PENDING_APPROVAL"
  | "NEW_PENDING_EVALUATION"
  | "DEADLINE_WARNING"
  | "GENERAL";

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; color: string }> = {
  NEW_PENDING_APPROVAL: { icon: Star, color: "text-blue-500 bg-blue-50" },
  NEW_PENDING_EVALUATION: { icon: Shield, color: "text-purple-500 bg-purple-50" },
  COMPLIMENT_APPROVED: { icon: Check, color: "text-green-500 bg-green-50" },
  COMPLIMENT_REJECTED: { icon: X, color: "text-red-500 bg-red-50" },
  COMPLIMENT_RETURNED: { icon: RotateCcw, color: "text-orange-500 bg-orange-50" },
  COMPLIMENT_EVALUATED: { icon: Award, color: "text-yellow-500 bg-yellow-50" },
  COMPLIMENT_REEVALUATED: { icon: Award, color: "text-purple-500 bg-purple-50" },
  DEADLINE_WARNING: { icon: Shield, color: "text-red-500 bg-red-50" },
  GENERAL: { icon: Bell, color: "text-gray-500 bg-gray-50" },
};

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id?: string | null;
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("Todas as notificações marcadas como lidas");
    router.refresh();
  }

  const unreadCount = items.filter((n) => !n.is_read).length;


  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sem notificações</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <Check className="w-4 h-4 mr-1" /> Marcar todas como lidas
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {items.map((n) => {
          const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.GENERAL;
          const Icon = config.icon;
          return (
            <Card
              key={n.id}
              className={`border-0 shadow-sm cursor-pointer transition-colors ${!n.is_read ? "ring-1 ring-primary/20 bg-primary/5" : ""}`}
              onClick={() => !n.is_read && markRead(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-medium text-sm ${!n.is_read ? "" : "text-muted-foreground"}`}>{n.title}</p>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
