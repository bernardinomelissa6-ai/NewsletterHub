"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <p className="text-muted-foreground text-sm">Ocorreu um erro ao carregar esta página.</p>
      <p className="text-xs text-destructive font-mono">{error.message}</p>
      <Button onClick={reset} variant="outline" size="sm">Tentar novamente</Button>
    </div>
  );
}
