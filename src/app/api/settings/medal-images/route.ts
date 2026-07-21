import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { upsertMedalImage, deleteMedalImage } from "@/services/medal-image.service";
import { MedalType } from "@/lib/supabase/types";

const VALID_TYPES: string[] = Object.values(MedalType);

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { type, imageUrl } = await req.json();
    if (!VALID_TYPES.includes(type) || typeof imageUrl !== "string" || !imageUrl) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const image = await upsertMedalImage(type as MedalType, imageUrl);
    return NextResponse.json(image);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const { type } = await req.json();
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    await deleteMedalImage(type as MedalType);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 400 });
  }
}
