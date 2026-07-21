import { addDays, formatISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { createClient } from "@/lib/supabase/server";
import { computeDaySlots, type Slot } from "@/lib/scheduling/slots";
import { CENTER_TZ } from "@/lib/constants";

const MIN_LEAD_MINUTES = 120; // no reservar con menos de 2h de anticipación

export async function fetchSlotsForRange(professionalId: string, fromDate: string, toDate: string): Promise<Record<string, Slot[]>> {
  const supabase = await createClient();
  const [{ data: pro }, { data: rules }, { data: exceptions }, { data: busy }] = await Promise.all([
    supabase.from("professionals").select("id, session_duration_min, is_active").eq("id", professionalId).maybeSingle(),
    supabase.from("availability_rules").select("*").eq("professional_id", professionalId),
    supabase.from("availability_exceptions").select("*").eq("professional_id", professionalId).gte("date", fromDate).lte("date", toDate),
    supabase.from("appointments").select("starts_at, ends_at").eq("professional_id", professionalId)
      .eq("status", "confirmed").gte("starts_at", `${fromDate}T00:00:00Z`).lte("starts_at", `${toDate}T23:59:59Z`),
  ]);
  if (!pro || !pro.is_active) return {};

  const days: Record<string, Slot[]> = {};
  const now = new Date();
  let d = new Date(`${fromDate}T12:00:00Z`);
  const end = new Date(`${toDate}T12:00:00Z`);
  while (d <= end) {
    const date = formatISO(d, { representation: "date" });
    const slots = computeDaySlots({
      date, rules: rules ?? [], exceptions: exceptions ?? [], busy: busy ?? [],
      durationMin: pro.session_duration_min, timezone: CENTER_TZ, now, minLeadMinutes: MIN_LEAD_MINUTES,
    });
    if (slots.length) days[date] = slots;
    d = addDays(d, 1);
  }
  return days;
}

export function slotLabel(iso: string): string {
  return formatInTimeZone(iso, CENTER_TZ, "HH:mm");
}
