import type { Metadata } from "next";
import { z } from "zod";
import { getPanelContext } from "@/lib/panel";
import { createClient } from "@/lib/supabase/server";
import { CENTER_TZ } from "@/lib/constants";
import { RulesEditor } from "@/components/panel/rules-editor";
import { ExceptionsEditor } from "@/components/panel/exceptions-editor";
import type { AvailabilityRule, AvailabilityException } from "@/lib/types";

export const metadata: Metadata = { title: "Disponibilidad" };

type Props = { searchParams: Promise<{ profesional?: string }> };

function todayInSantiago(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CENTER_TZ }).format(new Date());
}

export default async function DisponibilidadPage({ searchParams }: Props) {
  const { profesional } = await searchParams;
  const { role, professionalId } = await getPanelContext();
  const supabase = await createClient();

  let professionals: { id: string; full_name: string }[] = [];
  let targetProfessionalId: string | null = professionalId;

  if (role === "admin") {
    const { data } = await supabase
      .from("professionals")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name", { ascending: true });
    professionals = data ?? [];
    const requestedIsValid =
      !!profesional &&
      z.string().uuid().safeParse(profesional).success &&
      professionals.some((p) => p.id === profesional);
    targetProfessionalId = requestedIsValid ? (profesional as string) : (professionals[0]?.id ?? null);
  }

  let rules: AvailabilityRule[] = [];
  let exceptions: AvailabilityException[] = [];

  if (targetProfessionalId) {
    const today = todayInSantiago();
    const [{ data: rulesData }, { data: exceptionsData }] = await Promise.all([
      supabase
        .from("availability_rules")
        .select("id, professional_id, weekday, start_time, end_time, modality")
        .eq("professional_id", targetProfessionalId)
        .order("weekday", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase
        .from("availability_exceptions")
        .select("id, professional_id, date, start_time, end_time, kind, reason")
        .eq("professional_id", targetProfessionalId)
        .gte("date", today)
        .order("date", { ascending: true }),
    ]);
    rules = (rulesData ?? []) as AvailabilityRule[];
    exceptions = (exceptionsData ?? []) as AvailabilityException[];
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-ink">Disponibilidad</h1>
        {role === "admin" && (
          <form method="get" className="flex items-center gap-2 text-sm">
            <select
              name="profesional"
              defaultValue={targetProfessionalId ?? ""}
              className="h-9 rounded-lg border border-ink/15 bg-white px-3 text-ink"
            >
              {professionals.length === 0 && <option value="">Sin profesionales</option>}
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full border border-ink/15 px-4 py-1.5 text-ink/70 transition hover:bg-ink/5 hover:text-ink"
            >
              Ver
            </button>
          </form>
        )}
      </div>

      {!targetProfessionalId ? (
        <div className="mt-8 rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-ink/70">
            {role === "admin" ? "No hay profesionales activos." : "No se encontró tu perfil profesional."}
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="font-heading text-xl text-ink">Horario semanal</h2>
            <div className="mt-4">
              <RulesEditor professionalId={targetProfessionalId} rules={rules} />
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl text-ink">Bloqueos y aperturas</h2>
            <div className="mt-4">
              <ExceptionsEditor professionalId={targetProfessionalId} exceptions={exceptions} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
