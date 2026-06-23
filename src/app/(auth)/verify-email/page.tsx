"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Loader2, MailCheck, RefreshCw } from "lucide-react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function onVerify() {
    if (code.length !== 6) { toast.error("Digite o código de 6 dígitos"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Código inválido ou expirado"); return; }
      toast.success("Conta ativada! Faça login para continuar.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) toast.success("Novo código enviado para seu e-mail!");
      else toast.error("Não foi possível reenviar o código");
    } finally {
      setResending(false);
    }
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center space-y-2">
        <div className="w-16 h-16 gradient-brand rounded-full flex items-center justify-center mx-auto">
          <MailCheck className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para<br />
          <strong className="text-foreground">{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg font-bold" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          ⏱ O código expira em 10 minutos
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button className="w-full" onClick={onVerify} disabled={loading || code.length !== 6}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</> : "Verificar conta"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={onResend} disabled={resending}>
          {resending ? <><Loader2 className="w-4 h-4 animate-spin" /> Reenviando...</> : <><RefreshCw className="w-4 h-4" /> Reenviar código</>}
        </Button>
      </CardFooter>
    </Card>
  );
}
