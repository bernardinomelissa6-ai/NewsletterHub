import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getMedalImages } from "@/services/medal-image.service";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const images = await getMedalImages();
  return NextResponse.json(images);
}
