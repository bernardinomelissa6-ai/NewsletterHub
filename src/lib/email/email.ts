import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.EMAIL_FROM_NAME ?? "Newsletter Hub"} <${process.env.EMAIL_FROM ?? "noreply@empresa.com.br"}>`;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    if (error) {
      console.error("[Email] Erro ao enviar:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Exceção:", err);
    return false;
  }
}

// ── Templates ──────────────────────────────────────────────────────────────

const BASE_STYLE = `
  font-family: Inter, 'Plus Jakarta Sans', sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #F8F9FA;
  border-radius: 12px;
  overflow: hidden;
`;

const HEADER_STYLE = `
  background: #48086F;
  padding: 24px 32px;
  color: white;
`;

const BODY_STYLE = `
  padding: 32px;
  background: white;
`;

const FOOTER_STYLE = `
  padding: 16px 32px;
  background: #F8F9FA;
  color: #6B7280;
  font-size: 12px;
  text-align: center;
`;

const BTN_STYLE = `
  display: inline-block;
  background: #48086F;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  margin-top: 16px;
`;

function wrap(content: string): string {
  return `
    <div style="${BASE_STYLE}">
      <div style="${HEADER_STYLE}">
        <h1 style="margin:0;font-size:20px;">Newsletter Hub</h1>
      </div>
      <div style="${BODY_STYLE}">${content}</div>
      <div style="${FOOTER_STYLE}">
        Este é um e-mail automático. Não responda a esta mensagem.
      </div>
    </div>
  `;
}

export function buildVerificationEmail(code: string, name: string): string {
  return wrap(`
    <h2 style="color:#48086F;margin-top:0;">Olá, ${name}!</h2>
    <p>Use o código abaixo para ativar sua conta:</p>
    <div style="background:#F3E8FF;border:2px solid #B286D1;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#48086F;">${code}</span>
    </div>
    <p style="color:#6B7280;font-size:14px;">⏱ Este código expira em <strong>10 minutos</strong>.</p>
    <p style="color:#6B7280;font-size:14px;">Se você não solicitou este código, ignore este e-mail.</p>
  `);
}

export function buildComplimentApprovedEmail(name: string, insured: string): string {
  return wrap(`
    <h2 style="color:#48086F;margin-top:0;">Elogio Aprovado!</h2>
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Seu elogio recebido de <strong>${insured}</strong> foi <strong style="color:#16A34A;">aprovado pelo gestor</strong> e encaminhado para avaliação.</p>
    <p>Em breve você receberá a avaliação com a medalha atribuída.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/compliments" style="${BTN_STYLE}">Ver meus elogios</a>
  `);
}

export function buildComplimentRejectedEmail(name: string, insured: string, reason: string): string {
  return wrap(`
    <h2 style="color:#DC2626;margin-top:0;">Elogio Não Aprovado</h2>
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Seu elogio recebido de <strong>${insured}</strong> não foi aprovado.</p>
    <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:16px;border-radius:4px;margin:16px 0;">
      <strong>Motivo:</strong><br/>${reason}
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/compliments" style="${BTN_STYLE}">Ver meus elogios</a>
  `);
}

export function buildComplimentReturnedEmail(name: string, insured: string, observation: string): string {
  return wrap(`
    <h2 style="color:#D97706;margin-top:0;">Elogio Devolvido para Ajuste</h2>
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Seu elogio recebido de <strong>${insured}</strong> foi devolvido para ajuste.</p>
    <div style="background:#FFFBEB;border-left:4px solid #D97706;padding:16px;border-radius:4px;margin:16px 0;">
      <strong>Observação do gestor:</strong><br/>${observation}
    </div>
    <p>Por favor, atualize o registro e reenvie para aprovação.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/compliments" style="${BTN_STYLE}">Ajustar elogio</a>
  `);
}

export function buildComplimentEvaluatedEmail(name: string, insured: string, medal: string, justification: string): string {
  const medalEmoji: Record<string, string> = {
    SPECIAL: "🏆",
    GOLD: "🥇",
    SILVER: "🥈",
    BRONZE: "🥉",
  };
  const medalLabel: Record<string, string> = {
    SPECIAL: "Especial",
    GOLD: "Ouro",
    SILVER: "Prata",
    BRONZE: "Bronze",
  };
  return wrap(`
    <h2 style="color:#48086F;margin-top:0;">Elogio Avaliado! ${medalEmoji[medal] ?? "⭐"}</h2>
    <p>Olá, <strong>${name}</strong>!</p>
    <p>Seu elogio recebido de <strong>${insured}</strong> foi avaliado.</p>
    <div style="background:#F3E8FF;border:2px solid #B286D1;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <div style="font-size:48px;">${medalEmoji[medal] ?? "⭐"}</div>
      <div style="font-size:24px;font-weight:bold;color:#48086F;">Medalha ${medalLabel[medal] ?? medal}</div>
    </div>
    <div style="background:#F9FAFB;border-left:4px solid #48086F;padding:16px;border-radius:4px;margin:16px 0;">
      <strong>Justificativa:</strong><br/>${justification}
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="${BTN_STYLE}">Ver meu dashboard</a>
  `);
}

export function buildNewPendingApprovalEmail(managerName: string, collaboratorName: string, insured: string): string {
  return wrap(`
    <h2 style="color:#48086F;margin-top:0;">Novo Elogio Aguardando Aprovação</h2>
    <p>Olá, <strong>${managerName}</strong>!</p>
    <p><strong>${collaboratorName}</strong> registrou um novo elogio recebido de <strong>${insured}</strong> que aguarda sua aprovação.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/compliments/pending-approval" style="${BTN_STYLE}">Revisar elogios</a>
  `);
}

export function buildNewPendingEvaluationEmail(directorName: string, collaboratorName: string, insured: string): string {
  return wrap(`
    <h2 style="color:#48086F;margin-top:0;">Novo Elogio Aguardando Avaliação</h2>
    <p>Olá, <strong>${directorName}</strong>!</p>
    <p>O elogio de <strong>${collaboratorName}</strong>, recebido de <strong>${insured}</strong>, foi aprovado e aguarda sua avaliação e classificação.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/compliments/pending-evaluation" style="${BTN_STYLE}">Avaliar elogios</a>
  `);
}
