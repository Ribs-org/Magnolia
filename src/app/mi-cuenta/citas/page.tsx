import Link from "next/link";
import type { Metadata } from "next";
import { getSessionProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCancellationWindowHours } from "@/lib/settings";
import { canPatientModify } from "@/lib/scheduling/cancellation";
import { AppointmentCard, type PortalAppointment } from "@/components/portal/appointment-card";

export const metadata: Metadata = { title: "Mis citas" };

type Props = { searchParams: Promise<{ nueva?: string }> };

export default async function MisCitasPage({ searchParams }: Props) {
  const { nueva } = await searchParams;
  const session = await getSessionProfile();
  if (!session) return null; // el layout ya exige sesión; guarda de tipos

  const supabase = await createClient();
  const now = new Date();

  const [{ data }, windowHours] = await Promise.all([
    supabase
      .from("appointments")
      .select("*, professional:professionals(full_name, slug, specialty)")
      .eq("patient_id", session.user.id)
      .order("starts_at", { ascending: false }),
    getCancellationWindowHours(),
  ]);

  const all = (data ?? []) as PortalAppointment[];
  const isUpcoming = (a: PortalAppointment) => a.status === "confirmed" && new Date(a.starts_at) >= now;

  const upcoming = all.filter(isUpcoming).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const history = all.filter((a) => !isUpcoming(a));

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Mis citas</h1>

      {nueva && (
        <div className="mt-6 rounded-xl bg-sage/10 px-5 py-4 text-sm text-sage-dark">
          ¡Tu hora quedó confirmada! Te enviamos un correo con los detalles.
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-heading text-xl text-ink">Próximas</h2>
        <div className="mt-4 space-y-4">
          {upcoming.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-ink/70">No tienes citas próximas agendadas.</p>
              <Link
                href="/reservar"
                className="mt-5 inline-block rounded-full bg-sage px-6 py-2.5 text-sm text-white transition hover:bg-sage-dark"
              >
                Reservar una hora
              </Link>
            </div>
          ) : (
            upcoming.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                canModify={canPatientModify(new Date(appt.starts_at), now, windowHours)}
              />
            ))
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-heading text-xl text-ink">Historial</h2>
        <div className="mt-4 space-y-4">
          {history.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-center text-sm text-ink/60 shadow-sm">
              Aún no tienes historial de citas.
            </p>
          ) : (
            history.map((appt) => <AppointmentCard key={appt.id} appt={appt} canModify={false} />)
          )}
        </div>
      </section>
    </div>
  );
}
