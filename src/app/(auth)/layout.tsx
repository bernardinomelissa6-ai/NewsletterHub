import type { Metadata } from "next";
import { Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Acesso",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand flex-col justify-between p-10 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg leading-none">Sistema de</p>
            <p className="text-purple-200 text-sm">Reconhecimento</p>
          </div>
        </div>

        <div>
          <blockquote className="text-2xl font-semibold leading-relaxed">
            "Reconhecer o esforço é o primeiro passo para cultivar a excelência."
          </blockquote>
          <p className="mt-4 text-purple-200 text-sm">
            Plataforma corporativa de gestão de elogios, treinamentos e reconhecimento profissional.
          </p>
        </div>

        <div className="flex gap-6 text-sm text-purple-200">
          <div>
            <p className="text-2xl font-bold text-white">⭐</p>
            <p>Elogios</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">🏆</p>
            <p>Medalhas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">📈</p>
            <p>Rankings</p>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">Sistema de Reconhecimento</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
