import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "reconhecimento";
const MAX_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { filename, contentType, fileSize, folder } = await req.json();

    if (!filename || !folder) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    if (fileSize && fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo: 1GB" }, { status: 400 });
    }

    const sanitized = (filename as string).replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}_${sanitized}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      publicUrl: publicData.publicUrl,
    });
  } catch (err: any) {
    console.error("[POST /api/storage/presign]", err);
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
