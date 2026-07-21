import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDaySlots, type Slot } from "@/lib/scheduling/slots";
import { CENTER_TZ } from "@/lib/constants";

const MIN_LEAD_MINUTES = 120; // no reservar con menos de 2h de anticipación

export async function fetchSlotsForRange(
  professionalId: string,
  fromDate: string,
  toDate: string,
  opts?: { minLeadMinutes?: number }
): Promise<Record<string, Slot[]>> {
  const supabase = await createClient();
  // Las reglas/excepciones de disponibilidad y las citas ajenas no son legibles con el
  // cliente del visitante (RLS: solo dueño o admin); estas consultas usan service-role y
  // solo exponen horarios ya calculados (computeDaySlots), nunca las filas crudas.
  const admin = createAdminClient();
  const rangeStart = fromZonedTime(`${fromDate}T00:00:00`, CENTER_TZ).toISOString();
  const rangeEnd = fromZonedTime(`${toDate}T23:59:59`, CENTER_TZ).toISOString();
  const [{ data: pro }, { data: rules }, { data: exceptions }, { data: busy }] = await Promise.all([
    supabase.from("professionals").select("id, session_duration_min, is_active").eq("id", professionalId).maybeSingle(),
    admin.from("availability_rules").select("*").eq("professional_id", professionalId),
    admin.from("availability_exceptions").select("*").eq("professional_id", professionalId).gte("date", fromDate).lte("date", toDate),
    admin.from("appointments").select("starts_at, ends_at").eq("professional_id", professionalId)
      .eq("status", "confirmed").gte("starts_at", rangeStart).lte("starts_at", rangeEnd),
  ]);
  if (!pro || !pro.is_active) return {};

  const minLeadMinutes = opts?.minLeadMinutes ?? MIN_LEAD_MINUTES;
  const days: Record<string, Slot[]> = {};
  const now = new Date();
  let d = new Date(`${fromDate}T12:00:00Z`);
  const end = new Date(`${toDate}T12:00:00Z`);
  while (d <= end) {
    const date = d.toISOString().slice(0, 10);
    const slots = computeDaySlots({
      date, rules: rules ?? [], exceptions: exceptions ?? [], busy: busy ?? [],
      durationMin: pro.session_duration_min, timezone: CENTER_TZ, now, minLeadMinutes,
    });
    if (slots.length) days[date] = slots;
    d = addDays(d, 1);
  }
  return days;
}

export function slotLabel(iso: string): string {
  return formatInTimeZone(iso, CENTER_TZ, "HH:mm");
}
