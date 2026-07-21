import { CENTER_TZ } from "@/lib/constants";
import { StatusButtons } from "@/components/panel/status-buttons";
import { NoteEditor } from "@/components/panel/note-editor";
import type { AppointmentStatus, Modality } from "@/lib/types";

export interface AgendaAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  modality: Modality;
  status: AppointmentStatus;
  patient: { full_name: string; phone: string | null } | null;
  professional?: { full_name: string } | null;
}

const timeFormatter = new Intl.DateTimeFormat("es-CL", { hour: "2-digit", minute: "2-digit", timeZone: CENTER_TZ });
const dayFormatter = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: CENTER_TZ });
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: CENTER_TZ });

function statusMeta(status: AppointmentStatus): { label: string; className: string } {
  switch (status) {
    case "confirmed":
      return { label: "Confirmada", className: "bg-sage/15 text-sage-dark" };
    case "completed":
      return { label: "Completada", className: "bg-lilac/20 text-ink/70" };
    case "no_show":
      return { label: "No asistió", className: "bg-red-100 text-red-700" };
    case "cancelled_by_patient":
    case "cancelled_by_center":
      return { label: "Cancelada", className: "bg-ink/10 text-ink/50" };
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function AgendaList({
  appointments,
  role,
  notesByAppointment,
}: {
  appointments: AgendaAppointment[];
  role: "professional" | "admin";
  notesByAppointment?: Record<string, string>;
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-ink/70">No hay citas para este rango.</p>
      </div>
    );
  }

  const todayKey = dayKeyFormatter.format(new Date());
  const groups = new Map<string, AgendaAppointment[]>();
  for (const appt of appointments) {
    const key = dayKeyFormatter.format(new Date(appt.starts_at));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(appt);
  }
  const days = [...groups.keys()].sort();

  return (
    <div className="space-y-8">
      {days.map((day) => {
        const dayAppts = groups.get(day)!.slice().sort((a, b) => a.starts_at.localeCompare(b.starts_at));
        return (
          <section key={day}>
            <h2 className="font-heading text-lg text-ink">
              {capitalize(dayFormatter.format(new Date(`${day}T12:00:00Z`)))}
            </h2>
            <div className="mt-3 space-y-3">
              {dayAppts.map((appt) => {
                const status = statusMeta(appt.status);
                const apptDayKey = dayKeyFormatter.format(new Date(appt.starts_at));
                const isPastOrToday = apptDayKey <= todayKey;
                return (
                  <div key={appt.id} className="rounded-xl bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-base text-ink">{timeFormatter.format(new Date(appt.starts_at))}</p>
                        <p className="mt-1 text-sm text-ink/80">
                          {appt.patient?.full_name ?? "Paciente"}
                          {appt.patient?.phone && <span className="text-ink/50"> · {appt.patient.phone}</span>}
                        </p>
                        {role === "admin" && appt.professional && (
                          <p className="mt-0.5 text-xs text-ink/50">{appt.professional.full_name}</p>
                        )}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {appt.modality === "in_person" ? (
                        <span className="rounded-full bg-sage/10 px-3 py-1 text-xs text-sage-dark">Presencial</span>
                      ) : (
                        <span className="rounded-full bg-lilac/20 px-3 py-1 text-xs text-ink/70">Online</span>
                      )}
                    </div>

                    {role === "professional" && (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {isPastOrToday && <StatusButtons appointmentId={appt.id} status={appt.status} />}
                        <NoteEditor appointmentId={appt.id} initialBody={notesByAppointment?.[appt.id] ?? ""} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
