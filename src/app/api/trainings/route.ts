import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createTraining, getTrainings } from "@/services/training.service";
import { createTrainingSchema, trainingFilterSchema } from "@/lib/validations/training.schema";
import { uploadFile, ALLOWED_TRAINING_TYPES } from "@/lib/storage/supabase-storage";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = trainingFilterSchema.parse(Object.fromEntries(searchParams));
  const result = await getTrainings(filter, session.user.id, session.user.role);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();

    const data = {
      insured: formData.get("insured") as string,
      date: formData.get("date") as string,
      type: formData.get("type") as string,
      branch: formData.get("branch") as string,
      collaboratorId: formData.get("collaboratorId") as string,
    };

    const parsed = createTrainingSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    let attachmentType: string | undefined;

    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      const uploaded = await uploadFile(file, "trainings", ALLOWED_TRAINING_TYPES);
      attachmentUrl = uploaded.url;
      attachmentName = uploaded.name;
      attachmentType = uploaded.type;
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;

    const training = await createTraining(
      parsed.data,
      session.user.id,
      session.user.name ?? "Desconhecido",
      session.user.role,
      attachmentUrl,
      attachmentName,
      attachmentType,
      ipAddress
    );

    return NextResponse.json(training, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
