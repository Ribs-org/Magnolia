import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchSlotsForRange } from "@/lib/scheduling/fetch-slots";

const query = z.object({
  professionalId: z.string().uuid(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: NextRequest) {
  const parsed = query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  const { professionalId, from, to } = parsed.data;
  if (new Date(to).getTime() - new Date(from).getTime() > 45 * 86_400_000) {
    return NextResponse.json({ error: "Rango máximo 45 días" }, { status: 400 });
  }
  const days = await fetchSlotsForRange(professionalId, from, to);
  return NextResponse.json({ days });
}
