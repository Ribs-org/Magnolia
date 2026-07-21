"use server";
import { revalidatePath } from "next/cache";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canPatientModify } from "@/lib/scheduling/cancellation";
import { getCancellationWindowHours, getSetting } from "@/lib/settings";
import { sendEmail } from "@/lib/email/send";
import { bookingCancelledEmail } from "@/lib/email/templates";
import { CENTER_PHONE } from "@/lib/constants";

export async function cancelMyAppointment(appointmentId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getSessionProfile();
  if (!session) return { ok: false, error: "Sesión expirada" };
  const supabase = await createClient();

  // No usar `profile:profiles(...)` ni `professionals.meeting_url`: RLS bloquea el join
  // a profiles y esa columna está revocada para authenticated. full_name ya vive en
  // professionals. El link de la reunión (si aplica) vive en la propia cita
  // (appointments.meeting_url), completado por un trigger de la BD al crearla.
  const { data: appt } = await supabase
    .from("appointments")
    .select("*, professional:professionals(full_name, slug)")
    .eq("id", appointmentId)
    .eq("patient_id", session.user.id)
    .eq("status", "confirmed")
    .maybeSingle();
  if (!appt) return { ok: false, error: "Cita no encontrada" };

  const windowHours = await getCancellationWindowHours();
  if (!canPatientModify(new Date(appt.starts_at), new Date(), windowHours)) {
    const phone = (await getSetting("center_phone")) ?? CENTER_PHONE;
    return {
      ok: false,
      error: `Solo puedes cancelar con más de ${windowHours} horas de anticipación. Llámanos al ${phone} para ayudarte.`,
    };
  }

  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled_by_patient", cancelled_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .eq("patient_id", session.user.id)
    .eq("status", "confirmed")
    .select("id");
  if (error) return { ok: false, error: "No se pudo cancelar. Intenta de nuevo." };
  if (!updated || updated.length === 0) {
    return { ok: false, error: "La cita ya no se puede cancelar (su estado cambió). Actualiza la página." };
  }

  try {
    const email = bookingCancelledEmail({
      patientName: session.profile.full_name,
      professionalName: appt.professional?.full_name ?? "",
      startsAt: appt.starts_at,
      cancelledBy: "patient",
    });
    await sendEmail({ to: session.user.email!, subject: email.subject, html: email.html });
  } catch (e) {
    console.error("[appointments] email:", e);
  }

  revalidatePath("/mi-cuenta/citas");
  revalidatePath("/mi-cuenta");
  return { ok: true };
}
