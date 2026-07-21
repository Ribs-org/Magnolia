import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { reminderEmail } from "@/lib/email/templates";

// Recordatorios de citas confirmadas que empiezan dentro de las próximas 24h.
// Vercel Cron llama este endpoint una vez al día (ver vercel.json) con el
// header Authorization: Bearer $CRON_SECRET.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const supabase = createAdminClient();
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 3_600_000);
  const { data: appts, error } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, modality, meeting_url, patient:profiles!appointments_patient_id_fkey(full_name, id), professional:professionals(full_name)"
    )
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", now.toISOString())
    .lte("starts_at", until.toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  // El shape anidado está garantizado por el select de arriba; se tipa `any`
  // localmente para evitar fricción con los tipos generados de Supabase.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const a of (appts ?? []) as any[]) {
    const { data: user } = await supabase.auth.admin.getUserById(a.patient.id);
    if (!user?.user?.email) continue;
    const mail = reminderEmail({
      patientName: a.patient.full_name,
      professionalName: a.professional?.full_name ?? "",
      startsAt: a.starts_at,
      modality: a.modality,
      meetingUrl: a.meeting_url,
    });
    await sendEmail({ to: user.user.email, subject: mail.subject, html: mail.html });
    await supabase.from("appointments").update({ reminder_sent_at: new Date().toISOString() }).eq("id", a.id);
    sent++;
  }
  return NextResponse.json({ sent });
}
