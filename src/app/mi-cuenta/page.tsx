import Link from "next/link";
import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCancellationWindowHours } from "@/lib/settings";
import { canPatientModify } from "@/lib/scheduling/cancellation";
import { AppointmentCard, type PortalAppointment } from "@/components/portal/appointment-card";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function MiCuentaPage() {
  const session = await getSessionProfile();
  if (!session) return null; // el layout ya exige sesión; guarda de tipos

  const supabase = await createClient();
  const now = new Date();

  const [{ data }, windowHours] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, professional:professionals(full_name, slug, specialty)")
      .eq("patient_id", session.user.id)
      .eq("status", "confirmed")
      .gte("starts_at", now.toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    getCancellationWindowHours(),
  ]);

  const next = data as PortalAppointment | null;
  const canModify = next ? canPatientModify(new Date(next.starts_at), now, windowHours) : false;
  const firstName = session.profile.full_name.split(" ")[0] || session.profile.full_name;

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Hola, {firstName}</h1>
      <p className="mt-2 text-ink/70">Este es tu espacio para revisar y administrar tus horas en Magnolia.</p>

      <section className="mt-8">
        <h2 className="font-heading text-xl text-ink">Tu próxima cita</h2>
        <div className="mt-4">
          {next ? (
            <AppointmentCard appt={next} canModify={canModify} />
          ) : (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-ink/70">No tienes ninguna cita agendada por el momento.</p>
              <Link
                href="/reservar"
                className="mt-5 inline-block rounded-full bg-sage px-6 py-2.5 text-sm text-white transition hover:bg-sage-dark"
              >
                Reservar una hora
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <Link
          href="/mi-cuenta/citas"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-sage"
        >
          <p className="font-heading text-lg text-ink">Mis citas</p>
          <p className="mt-1 text-sm text-ink/60">Revisa tus próximas horas y tu historial.</p>
        </Link>
        <Link
          href="/reservar"
          className="rounded-xl bg-white p-6 shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-sage"
        >
          <p className="font-heading text-lg text-ink">Reservar nueva hora</p>
          <p className="mt-1 text-sm text-ink/60">Agenda una nueva sesión con tu profesional de confianza.</p>
        </Link>
      </section>
    </div>
  );
}
