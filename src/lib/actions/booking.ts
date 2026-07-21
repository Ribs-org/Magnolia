"use server";
import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchSlotsForRange } from "@/lib/scheduling/fetch-slots";
import { sendEmail } from "@/lib/email/send";
import { bookingConfirmedEmail } from "@/lib/email/templates";
import { CENTER_TZ } from "@/lib/constants";
import type { Modality } from "@/lib/types";

const schema = z.object({
  professionalId: z.string().uuid(),
  startsAt: z.string().datetime(),
  modality: z.enum(["in_person", "online"]),
});

export async function createAppointment(input: {
  professionalId: string;
  startsAt: string;
  modality: Modality;
}): Promise<{ ok: true; appointmentId: string } | { ok: false; error: string; code?: "SLOT_TAKEN" }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Datos inválidos" };
  const session = await getSessionProfile();
  if (!session) return { ok: false as const, error: "Debes iniciar sesión" };
  const { professionalId, startsAt, modality } = parsed.data;

  const supabase = await createClient();
  // No usar `*, profile:profiles(full_name)`: RLS bloquea ese join y los grants de
  // columnas excluyen meeting_url para authenticated. full_name ya vive en professionals.
  const { data: pro } = await supabase.from("professionals")
    .select("id, full_name, specialty, modalities, session_duration_min, is_active")
    .eq("id", professionalId).eq("is_active", true).maybeSingle();
  if (!pro) return { ok: false as const, error: "Profesional no disponible" };
  if (!pro.modalities.includes(modality)) return { ok: false as const, error: "Modalidad no disponible" };

  // Revalidar que el slot exista y siga libre
  const date = formatInTimeZone(new Date(startsAt), CENTER_TZ, "yyyy-MM-dd");
  const days = await fetchSlotsForRange(professionalId, date, date);
  const slot = (days[date] ?? []).find(s => s.startsAt === new Date(startsAt).toISOString() && s.modality.includes(modality));
  if (!slot) return { ok: false as const, error: "Esa hora ya no está disponible", code: "SLOT_TAKEN" as const };

  // meeting_url para citas online lo completa un trigger de la BD de forma autoritativa;
  // no se lee de professionals ni se setea en el insert.
  const { data: appt, error } = await supabase.from("appointments").insert({
    patient_id: session.user.id,
    professional_id: professionalId,
    starts_at: slot.startsAt,
    ends_at: slot.endsAt,
    modality,
    source: "web",
  }).select("id, meeting_url").single();

  if (error) {
    if (error.code === "23P01") return { ok: false as const, error: "Esa hora acaba de ser tomada", code: "SLOT_TAKEN" as const };
    console.error("[booking]", error);
    return { ok: false as const, error: "No se pudo crear la reserva. Intenta de nuevo." };
  }

  try {
    const email = bookingConfirmedEmail({
      patientName: session.profile.full_name, professionalName: pro.full_name,
      startsAt: slot.startsAt, modality, meetingUrl: appt.meeting_url,
    });
    await sendEmail({ to: session.user.email!, subject: email.subject, html: email.html });
  } catch (e) {
    console.error("[booking] email:", e);
  }

  return { ok: true as const, appointmentId: appt.id };
}
