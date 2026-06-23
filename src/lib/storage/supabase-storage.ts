import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "reconhecimento";

export const ALLOWED_COMPLIMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export const ALLOWED_TRAINING_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export interface UploadResult {
  url: string;
  name: string;
  type: string;
}

export async function uploadFile(
  file: File,
  folder: "compliments" | "trainings",
  allowedTypes: string[]
): Promise<UploadResult> {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type}`);
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`);
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${folder}/${Date.now()}_${sanitized}`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Falha no upload: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  return {
    url: data.publicUrl,
    name: file.name,
    type: file.type,
  };
}

export async function deleteFile(url: string): Promise<void> {
  const path = url.split(`${BUCKET}/`)[1];
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}
