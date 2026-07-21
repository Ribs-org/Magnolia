import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { fetchSlotsForRange } from "@/lib/scheduling/fetch-slots";
import { getSessionProfile } from "@/lib/auth";

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
    lead: z.string().regex(/^\d+$/).optional(),
  })
  .refine((q) => isValidDate(q.from) && isValidDate(q.to), { message: "Fecha inválida" })
  .refine((q) => q.from <= q.to, { message: "Rango inválido" });

export async function GET(req: NextRequest) {
  const parsed = query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  const { professionalId, from, to, lead } = parsed.data;
  if (new Date(to).getTime() - new Date(from).getTime() > 45 * 86_400_000) {
    return NextResponse.json({ error: "Rango máximo 45 días" }, { status: 400 });
  }

  let minLeadMinutes: number | undefined;
  if (lead !== undefined) {
    // Solo un admin autenticado puede saltarse la anticipación mínima (agenda para hoy).
    const session = await getSessionProfile();
    if (session?.profile.role === "admin") minLeadMinutes = Number(lead);
  }

  const days = await fetchSlotsForRange(professionalId, from, to, minLeadMinutes !== undefined ? { minLeadMinutes } : undefined);
  return NextResponse.json({ days });
}
