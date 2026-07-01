"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center gap-2 w-full rounded-lg p-2 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground text-sm",
        collapsed && "justify-center"
      )}
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />
      ) : (
        <Moon className="w-4 h-4 flex-shrink-0" />
      )}
      {!collapsed && <span suppressHydrationWarning>{mounted ? (isDark ? "Modo Claro" : "Modo Escuro") : "Modo Escuro"}</span>}
    </button>
  );
}
