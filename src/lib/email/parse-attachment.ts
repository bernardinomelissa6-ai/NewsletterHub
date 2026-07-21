import MsgReaderImport, { type FieldsData } from "@kenjiuno/msgreader";
import PostalMime from "postal-mime";
import iconvLite from "iconv-lite";

// @kenjiuno/msgreader ships as a CJS module compiled with esModuleInterop;
// bundlers unwrap `.default` inconsistently, so resolve defensively.
const MsgReader: typeof MsgReaderImport =
  (MsgReaderImport as unknown as { default?: typeof MsgReaderImport }).default ?? MsgReaderImport;

export interface ParsedEmailAttachment {
  subject: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  date: string | null;
  bodyHtml: string | null;
  bodyText: string | null;
}

function formatAddress(name?: string | null, address?: string | null): string {
  const trimmedName = name?.trim();
  const trimmedAddress = address?.trim();
  if (trimmedName && trimmedAddress && trimmedName !== trimmedAddress) return `${trimmedName} <${trimmedAddress}>`;
  return trimmedName || trimmedAddress || "";
}

// Exchange sometimes exposes the sender only as an X.500 directory name
// (e.g. "/o=ExchangeLabs/ou=..."), which is meaningless to show as an email.
function isUsableAddress(address?: string | null): boolean {
  return !!address && !address.startsWith("/o=");
}

// Raw HTML bodies are untyped bytes; decode using the charset declared in
// the HTML itself (Outlook commonly emits Windows-1252), not blindly as UTF-8.
function decodeHtmlBytes(bytes: Uint8Array): string {
  const buffer = Buffer.from(bytes);
  const sniff = buffer.toString("latin1").slice(0, 2000);
  const charset = sniff.match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase() ?? "utf-8";
  if (iconvLite.encodingExists(charset)) return iconvLite.decode(buffer, charset);
  return buffer.toString("utf8");
}

export function parseMsgAttachment(buffer: ArrayBuffer): ParsedEmailAttachment {
  const reader = new MsgReader(buffer);
  const data = reader.getFileData();

  const recipients: FieldsData[] = data.recipients ?? [];
  const to = recipients
    .filter((r) => (r.recipType ?? "to") === "to")
    .map((r) => formatAddress(r.name, r.smtpAddress))
    .filter(Boolean)
    .join(", ");
  const cc = recipients
    .filter((r) => r.recipType === "cc")
    .map((r) => formatAddress(r.name, r.smtpAddress))
    .filter(Boolean)
    .join(", ");

  const senderAddress = [data.senderSmtpAddress, data.senderEmail].find(isUsableAddress) ?? null;
  const htmlFromBytes = data.html ? decodeHtmlBytes(data.html) : null;

  return {
    subject: data.subject ?? null,
    from: formatAddress(data.senderName, senderAddress) || null,
    to: to || null,
    cc: cc || null,
    date: data.clientSubmitTime ?? data.messageDeliveryTime ?? data.creationTime ?? null,
    bodyHtml: data.bodyHtml ?? htmlFromBytes,
    bodyText: data.body ?? null,
  };
}

export async function parseEmlAttachment(buffer: ArrayBuffer): Promise<ParsedEmailAttachment> {
  const email = await PostalMime.parse(buffer);

  const formatList = (list?: Array<{ name?: string; address?: string }>) =>
    (list ?? []).map((a) => formatAddress(a.name, a.address)).filter(Boolean).join(", ") || null;

  return {
    subject: email.subject ?? null,
    from: email.from ? formatAddress(email.from.name, email.from.address) || null : null,
    to: formatList(email.to),
    cc: formatList(email.cc),
    date: email.date ?? null,
    bodyHtml: email.html ?? null,
    bodyText: email.text ?? null,
  };
}
