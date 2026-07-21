"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard, Star, BookOpen, Trophy, Users, Building2,
  ClipboardList, FileText, Bell, Settings, Shield, Clock,
  ChevronLeft, ChevronRight, Award, History, Medal,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarUser } from "./SidebarUser";
import { ThemeToggle } from "./ThemeToggle";
import { useState, useEffect } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meus-elogios", label: "Meus Reconhecimentos", icon: Award, roles: ["COLLABORATOR"] },
  { href: "/compliments", label: "Elogios", icon: Star },
  { href: "/compliments/pending-approval", label: "Aprovar Elogios", icon: ClipboardList, roles: ["MANAGER", "ADMIN", "DIRETOR_CENTRAL"] },
  { href: "/compliments/pending-evaluation", label: "Avaliar Elogios", icon: Shield, roles: ["DIRECTOR", "ADMIN", "DIRETOR_CENTRAL"] },
  { href: "/minhas-avaliacoes", label: "Minhas Avaliações", icon: History, roles: ["DIRECTOR", "DIRETOR_CENTRAL"] },
  { href: "/minha-equipe", label: "Minha Equipe", icon: Users, roles: ["DIRECTOR", "DIRETOR_CENTRAL"] },
  { href: "/trainings", label: "Treinamentos", icon: BookOpen },
  { href: "/rankings/collaborators", label: "Ranking Colaboradores", icon: Trophy, roles: ["MANAGER", "ADMIN", "DIRETOR_CENTRAL"] },
  { href: "/rankings/areas", label: "Ranking Áreas", icon: Building2, roles: ["ADMIN", "DIRETOR_CENTRAL"] },
  { href: "/rankings/teams", label: "Ranking da Equipe", icon: Users, roles: ["MANAGER"] },
  { href: "/notifications", label: "Notificações", icon: Bell },
  { href: "/settings/profile", label: "Configurações", icon: Settings },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/users", label: "Usuários", icon: Users },
  { href: "/areas", label: "Áreas", icon: Building2 },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/audit", label: "Auditoria", icon: ClipboardList },
  { href: "/settings/deadlines", label: "Prazos", icon: Clock },
  { href: "/settings/branches", label: "Ramos", icon: Building2 },
  { href: "/settings/medals", label: "Medalhas", icon: Medal },
];

const DIRETOR_CENTRAL_ITEMS: NavItem[] = [
  { href: "/users", label: "Usuários", icon: Users },
  { href: "/areas", label: "Áreas", icon: Building2 },
  { href: "/reports", label: "Relatórios", icon: FileText },
  { href: "/audit", label: "Auditoria", icon: ClipboardList },
];

interface SidebarProps {
  userRole: string;
  unreadCount?: number;
}

export function Sidebar({ userRole, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored) setCollapsed(stored === "true");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const allNavHrefs = [...NAV_ITEMS, ...ADMIN_ITEMS, ...DIRETOR_CENTRAL_ITEMS].map((i) => i.href);

  const isActive = (href: string) => {
    if (!pathname.startsWith(href)) return false;
    if (href === "/dashboard") return pathname === href;
    // If a more specific nav item also matches the current path, this one is not active
    const hasMoreSpecificMatch = allNavHrefs.some(
      (other) => other !== href && other.startsWith(href + "/") && pathname.startsWith(other)
    );
    return !hasMoreSpecificMatch;
  };

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );

  const showAdmin = userRole === "ADMIN";
  const showDiretorCentral = userRole === "DIRETOR_CENTRAL";

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b min-h-[65px]">
        <div className="flex-shrink-0 w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-foreground leading-tight">Newsletter</p>
            <p className="text-xs text-primary font-semibold">Hub</p>
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full border bg-card shadow-sm flex items-center justify-center hover:bg-accent transition-colors"
        title={collapsed ? "Expandir" : "Recolher"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-1">
          {visibleNav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const isBell = item.href === "/notifications";
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="w-4 h-4" />
                  {isBell && unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {(showAdmin || showDiretorCentral) && (
            <>
              {!collapsed && (
                <div className="pt-4 pb-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Administração
                  </p>
                </div>
              )}
              {collapsed && <Separator className="my-2" />}
              {(showAdmin ? ADMIN_ITEMS : DIRETOR_CENTRAL_ITEMS).map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-3 space-y-2">
        <ThemeToggle collapsed={collapsed} />
        <SidebarUser collapsed={collapsed} />
      </div>
    </aside>
  );
}
