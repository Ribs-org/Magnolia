"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPanelContext } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; error?: string };

const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// El tipo `time` de Postgres vuelve como "HH:MM:SS"; lo normalizamos a "HH:MM"
// para comparar de forma segura contra los strings del formulario (mismo largo).
function toHHMM(t: string): string {
  return t.slice(0, 5);
}

const addRuleSchema = z
  .object({
    professionalId: z.string().uuid(),
    weekday: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_RE, "Hora inválida"),
    endTime: z.string().regex(TIME_RE, "Hora inválida"),
    modality: z.enum(["in_person", "online", "both"]),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "La hora de término debe ser posterior a la de inicio",
    path: ["endTime"],
  });

export async function addRule(input: {
  professionalId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  modality: "in_person" | "online" | "both";
}): Promise<ActionResult> {
  const parsed = addRuleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { professionalId, weekday, startTime, endTime, modality } = parsed.data;

  const { role, professionalId: myProfessionalId } = await getPanelContext();
  if (role === "professional" && myProfessionalId !== professionalId) {
    return { ok: false, error: "No autorizado" };
  }

  const supabase = await createClient();

  const { data: existingRules, error: fetchError } = await supabase
    .from("availability_rules")
    .select("start_time, end_time")
    .eq("professional_id", professionalId)
    .eq("weekday", weekday);
  if (fetchError) return { ok: false, error: "No se pudo validar el horario" };

  const overlaps = (existingRules ?? []).some((r) => {
    const existingStart = toHHMM(r.start_time);
    const existingEnd = toHHMM(r.end_time);
    return startTime < existingEnd && existingStart < endTime;
  });
  if (overlaps) return { ok: false, error: "Se superpone con otro horario" };

  const { error } = await supabase.from("availability_rules").insert({
    professional_id: professionalId,
    weekday,
    start_time: startTime,
    end_time: endTime,
    modality,
  });
  if (error) return { ok: false, error: "No se pudo guardar el horario" };

  revalidatePath("/panel/disponibilidad");
  return { ok: true };
}

export async function deleteRule(ruleId: string): Promise<ActionResult> {
  const parsedId = z.string().uuid().safeParse(ruleId);
  if (!parsedId.success) return { ok: false, error: "Horario inválido" };

  const { role, professionalId } = await getPanelContext();
  const supabase = await createClient();
  let query = supabase.from("availability_rules").delete().eq("id", parsedId.data);
  if (role === "professional") {
    if (!professionalId) return { ok: false, error: "No autorizado" };
    query = query.eq("professional_id", professionalId);
  }

  const { data: deleted, error } = await query.select("id");
  if (error) return { ok: false, error: "No se pudo eliminar el horario" };
  if (!deleted || deleted.length === 0) {
    return { ok: false, error: "No se pudo eliminar (verifica que sea tuyo)" };
  }

  revalidatePath("/panel/disponibilidad");
  return { ok: true };
}

const addExceptionSchema = z
  .object({
    professionalId: z.string().uuid(),
    date: z.string().regex(DATE_RE, "Fecha inválida"),
    startTime: z.string().regex(TIME_RE, "Hora inválida").optional(),
    endTime: z.string().regex(TIME_RE, "Hora inválida").optional(),
    kind: z.enum(["blocked", "extra_open"]),
    reason: z.string().max(300, "Motivo demasiado largo").optional(),
  })
  .refine((d) => isValidDate(d.date), { message: "Fecha inválida", path: ["date"] })
  .refine((d) => (d.startTime == null) === (d.endTime == null), {
    message: "Indica ambas horas o ninguna",
    path: ["endTime"],
  })
  .refine((d) => !(d.startTime && d.endTime) || d.endTime > d.startTime, {
    message: "La hora de término debe ser posterior a la de inicio",
    path: ["endTime"],
  })
  .refine((d) => d.kind !== "extra_open" || (!!d.startTime && !!d.endTime), {
    message: "Una apertura extra requiere horario",
    path: ["startTime"],
  });

export async function addException(input: {
  professionalId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  kind: "blocked" | "extra_open";
  reason?: string;
}): Promise<ActionResult> {
  const parsed = addExceptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const { professionalId, date, startTime, endTime, kind, reason } = parsed.data;

  const { role, professionalId: myProfessionalId } = await getPanelContext();
  if (role === "professional" && myProfessionalId !== professionalId) {
    return { ok: false, error: "No autorizado" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("availability_exceptions").insert({
    professional_id: professionalId,
    date,
    start_time: startTime ?? null,
    end_time: endTime ?? null,
    kind,
    reason: reason ?? null,
  });
  if (error) return { ok: false, error: "No se pudo guardar" };

  revalidatePath("/panel/disponibilidad");
  return { ok: true };
}

export async function deleteException(exceptionId: string): Promise<ActionResult> {
  const parsedId = z.string().uuid().safeParse(exceptionId);
  if (!parsedId.success) return { ok: false, error: "Excepción inválida" };

  const { role, professionalId } = await getPanelContext();
  const supabase = await createClient();
  let query = supabase.from("availability_exceptions").delete().eq("id", parsedId.data);
  if (role === "professional") {
    if (!professionalId) return { ok: false, error: "No autorizado" };
    query = query.eq("professional_id", professionalId);
  }

  const { data: deleted, error } = await query.select("id");
  if (error) return { ok: false, error: "No se pudo eliminar" };
  if (!deleted || deleted.length === 0) {
    return { ok: false, error: "No se pudo eliminar (verifica que sea tuyo)" };
  }

  revalidatePath("/panel/disponibilidad");
  return { ok: true };
}
