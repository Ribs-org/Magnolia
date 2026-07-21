import Link from "next/link";
import type { Metadata } from "next";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getPanelContext } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";
import { CENTER_TZ } from "@/lib/constants";
import { AgendaList, type AgendaAppointment } from "@/components/panel/agenda-list";
import { AdminAppointmentDialog, type AdminAppointmentProfessional } from "@/components/panel/admin-appointment-dialog";

export const metadata: Metadata = { title: "Agenda" };

type Vista = "dia" | "semana";
type Props = { searchParams: Promise<{ fecha?: string; vista?: string }> };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayInSantiago(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CENTER_TZ }).format(new Date());
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return addDays(new Date(Date.UTC(y, m - 1, d)), days).toISOString().slice(0, 10);
}

function mondayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const dow = base.getUTCDay(); // 0=domingo..6=sábado
  const diffToMonday = (dow + 6) % 7;
  return addDaysToDateStr(dateStr, -diffToMonday);
}

const dayFormatter = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: CENTER_TZ });
const shortDayFormatter = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", timeZone: CENTER_TZ });

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function PanelAgendaPage({ searchParams }: Props) {
  const { fecha: fechaParam, vista: vistaParam } = await searchParams;
  const { role, professionalId } = await getPanelContext();

  const fecha = fechaParam && DATE_RE.test(fechaParam) ? fechaParam : todayInSantiago();
  const vista: Vista = vistaParam === "semana" ? "semana" : "dia";

  const rangeStartStr = vista === "semana" ? mondayOf(fecha) : fecha;
  const rangeEndStr = vista === "semana" ? addDaysToDateStr(rangeStartStr, 6) : fecha;
  const rangeEndExclusiveStr = addDaysToDateStr(rangeEndStr, 1);

  const rangeStart = fromZonedTime(`${rangeStartStr}T00:00:00`, CENTER_TZ).toISOString();
  const rangeEnd = fromZonedTime(`${rangeEndExclusiveStr}T00:00:00`, CENTER_TZ).toISOString();

  const step = vista === "semana" ? 7 : 1;
  const prevFecha = addDaysToDateStr(fecha, -step);
  const nextFecha = addDaysToDateStr(fecha, step);
  const todayFecha = todayInSantiago();

  function hrefFor(f: string, v: Vista = vista): string {
    return `/panel?fecha=${f}&vista=${v}`;
  }

  const rangeLabel =
    vista === "semana"
      ? `Semana del ${shortDayFormatter.format(new Date(`${rangeStartStr}T12:00:00Z`))} al ${shortDayFormatter.format(new Date(`${rangeEndStr}T12:00:00Z`))}`
      : capitalize(dayFormatter.format(new Date(`${fecha}T12:00:00Z`)));

  let appointments: AgendaAppointment[] = [];
  const canQuery = role === "admin" || !!professionalId;

  if (canQuery) {
    const supabase = await createClient();
    let query = supabase
      .from("appointments")
      .select(
        role === "admin"
          ? "id, starts_at, ends_at, modality, status, professional_id, patient:profiles(full_name, phone), professional:professionals(full_name)"
          : "id, starts_at, ends_at, modality, status, patient:profiles(full_name, phone)"
      )
      .gte("starts_at", rangeStart)
      .lt("starts_at", rangeEnd)
      .order("starts_at", { ascending: true });

    if (role === "professional") {
      query = query.eq("professional_id", professionalId!);
    }

    const { data } = await query;
    appointments = (data ?? []) as unknown as AgendaAppointment[];
  }

  let adminProfessionals: AdminAppointmentProfessional[] = [];
  if (role === "admin") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("professionals")
      .select("id, full_name, modalities")
      .eq("is_active", true)
      .order("full_name", { ascending: true });
    adminProfessionals = (data ?? []) as AdminAppointmentProfessional[];
  }

  let notesByAppointment: Record<string, string> | undefined;
  if (role === "professional" && appointments.length > 0) {
    const supabase = await createClient();
    const ids = appointments.map((a) => a.id);
    const { data: notes } = await supabase
      .from("session_notes")
      .select("appointment_id, body")
      .in("appointment_id", ids);
    notesByAppointment = Object.fromEntries((notes ?? []).map((n) => [n.appointment_id, n.body as string]));
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-ink">Agenda</h1>
        <div className="flex items-center gap-3">
          {role === "admin" && <AdminAppointmentDialog professionals={adminProfessionals} />}
          <div className="flex items-center gap-1 text-sm">
            <Link
              href={hrefFor(prevFecha)}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-ink/70 transition hover:bg-ink/5"
            >
              ‹
            </Link>
            <Link
              href={hrefFor(todayFecha)}
              className="rounded-full border border-ink/15 px-4 py-1.5 text-ink/70 transition hover:bg-ink/5"
            >
              Hoy
            </Link>
            <Link
              href={hrefFor(nextFecha)}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-ink/70 transition hover:bg-ink/5"
            >
              ›
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-ink/70">{rangeLabel}</p>
        <div className="flex items-center gap-1 text-sm">
          <Link
            href={hrefFor(fecha, "dia")}
            className={`rounded-full px-3 py-1.5 transition ${vista === "dia" ? "bg-sage text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            Día
          </Link>
          <Link
            href={hrefFor(fecha, "semana")}
            className={`rounded-full px-3 py-1.5 transition ${vista === "semana" ? "bg-sage text-white" : "text-ink/60 hover:bg-ink/5"}`}
          >
            Semana
          </Link>
        </div>
      </div>

      <div className="mt-6">
        <AgendaList appointments={appointments} role={role} notesByAppointment={notesByAppointment} />
      </div>
    </div>
  );
}
