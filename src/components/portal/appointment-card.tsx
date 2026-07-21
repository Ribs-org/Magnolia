import { CENTER_TZ } from "@/lib/constants";
import { specialtyLabel } from "@/components/site/professional-card";
import { CancelDialog } from "@/components/portal/cancel-dialog";
import type { AppointmentStatus, Modality, Specialty } from "@/lib/types";

export interface PortalAppointment {
  id: string;
  starts_at: string;
  ends_at: string;
  modality: Modality;
  status: AppointmentStatus;
  meeting_url: string | null;
  professional: { full_name: string; slug: string; specialty: Specialty } | null;
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: CENTER_TZ,
});

function formatWhen(iso: string): string {
  const label = dateFormatter.format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

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

export function AppointmentCard({ appt, canModify }: { appt: PortalAppointment; canModify: boolean }) {
  const status = statusMeta(appt.status);
  const canJoin = appt.status === "confirmed" && appt.modality === "online" && !!appt.meeting_url;

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-heading text-lg text-ink">{formatWhen(appt.starts_at)}</p>
          <p className="mt-1 text-sm text-ink/70">
            {appt.professional?.full_name ?? "Profesional"}
            {appt.professional && <span className="text-ink/50"> · {specialtyLabel(appt.professional.specialty)}</span>}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {appt.modality === "in_person" ? (
          <span className="rounded-full bg-sage/10 px-3 py-1 text-xs text-sage-dark">Presencial</span>
        ) : (
          <span className="rounded-full bg-lilac/20 px-3 py-1 text-xs text-ink/70">Online</span>
        )}
      </div>

      {(canJoin || canModify) && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {canJoin && (
            <a
              href={appt.meeting_url!}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-sage px-5 py-2 text-sm text-white transition hover:bg-sage-dark"
            >
              Unirse a la videollamada
            </a>
          )}
          {canModify && (
            <CancelDialog appointmentId={appt.id} professionalSlug={appt.professional?.slug} />
          )}
        </div>
      )}
    </div>
  );
}
