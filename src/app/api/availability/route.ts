import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchSlotsForRange } from "@/lib/scheduling/fetch-slots";

function isValidDate(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const query = z
  .object({
    professionalId: z.string().uuid(),
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((q) => isValidDate(q.from) && isValidDate(q.to), { message: "Fecha inválida" })
  .refine((q) => q.from <= q.to, { message: "Rango inválido" });

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
