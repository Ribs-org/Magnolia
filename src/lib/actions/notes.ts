"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPanelContext } from "@/lib/panel";

export async function saveSessionNote(appointmentId: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = z.string().max(20_000).safeParse(body);
  if (!parsed.success) return { ok: false, error: "Nota demasiado larga" };
  const { professionalId } = await getPanelContext();
  if (!professionalId) return { ok: false, error: "Solo profesionales pueden escribir notas" };
  const supabase = await createClient();
  const { error } = await supabase.from("session_notes").upsert(
    { appointment_id: appointmentId, professional_id: professionalId, body: parsed.data, updated_at: new Date().toISOString() },
    { onConflict: "appointment_id" }
  );
  if (error) return { ok: false, error: "No se pudo guardar la nota" };
  revalidatePath("/panel");
  return { ok: true };
}
