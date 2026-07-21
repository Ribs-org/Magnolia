import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PacientesTable, type PacienteRow, type PacienteAppointment } from "@/components/panel/pacientes-table";

export const metadata: Metadata = { title: "Pacientes" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function PacientesPage({ searchParams }: Props) {
  await requireRole(["admin"], "/panel/pacientes");
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, rut, phone")
    .eq("role", "patient")
    .order("full_name", { ascending: true })
    .limit(100);

  const term = q?.trim();
  if (term) {
    const like = `%${term.replace(/[%,]/g, "")}%`;
    query = query.or(`full_name.ilike.${like},rut.ilike.${like},phone.ilike.${like}`);
  }

  const { data: patients } = await query;
  const rows: PacienteRow[] = patients ?? [];

  let appointmentsByPatient: Record<string, PacienteAppointment[]> = {};
  if (rows.length > 0) {
    const ids = rows.map((p) => p.id);
    const { data: appts } = await supabase
      .from("appointments")
      .select("id, patient_id, starts_at, status, modality, professional:professionals(full_name)")
      .in("patient_id", ids)
      .order("starts_at", { ascending: false });

    appointmentsByPatient = {};
    for (const a of appts ?? []) {
      const list = appointmentsByPatient[a.patient_id] ?? (appointmentsByPatient[a.patient_id] = []);
      if (list.length < 8) list.push(a as unknown as PacienteAppointment);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-ink">Pacientes</h1>
      </div>
      <div className="mt-6">
        <PacientesTable patients={rows} appointmentsByPatient={appointmentsByPatient} initialQuery={term ?? ""} />
      </div>
    </div>
  );
}
