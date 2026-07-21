import { fromZonedTime } from "date-fns-tz";
import type { AvailabilityException, AvailabilityRule, Modality } from "@/lib/types";

export interface Slot { startsAt: string; endsAt: string; modality: Modality[] }
interface Interval { start: number; end: number; modality: Modality[] } // epoch ms

interface Options {
  date: string; // YYYY-MM-DD (center timezone)
  rules: AvailabilityRule[];
  exceptions: AvailabilityException[];
  busy: { starts_at: string; ends_at: string }[];
  durationMin: number;
  timezone: string;
  now: Date;
  minLeadMinutes?: number;
}

function toUtc(date: string, time: string, tz: string): number {
  return fromZonedTime(`${date}T${time}:00`, tz).getTime();
}

function ruleModalities(m: AvailabilityRule["modality"]): Modality[] {
  return m === "both" ? ["in_person", "online"] : [m];
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function computeDaySlots(opts: Options): Slot[] {
  const { date, timezone, durationMin } = opts;
  const lead = (opts.minLeadMinutes ?? 0) * 60_000;
  const earliest = opts.now.getTime() + lead;

  // 1. Open windows: weekly rules + extra_open exceptions for this date
  const windows: Interval[] = opts.rules
    .filter(r => r.weekday === weekdayOf(date))
    .map(r => ({ start: toUtc(date, r.start_time, timezone), end: toUtc(date, r.end_time, timezone), modality: ruleModalities(r.modality) }));
  for (const e of opts.exceptions) {
    if (e.date === date && e.kind === "extra_open" && e.start_time && e.end_time) {
      windows.push({ start: toUtc(date, e.start_time, timezone), end: toUtc(date, e.end_time, timezone), modality: ["in_person", "online"] });
    }
  }

  // 2. Blocked intervals: blocked exceptions + existing appointments
  const blocked: { start: number; end: number }[] = [];
  for (const e of opts.exceptions) {
    if (e.date !== date || e.kind !== "blocked") continue;
    if (e.start_time && e.end_time) blocked.push({ start: toUtc(date, e.start_time, timezone), end: toUtc(date, e.end_time, timezone) });
    else blocked.push({ start: -Infinity, end: Infinity });
  }
  for (const b of opts.busy) blocked.push({ start: Date.parse(b.starts_at), end: Date.parse(b.ends_at) });

  // 3. Generate slots
  const dur = durationMin * 60_000;
  const slots: Slot[] = [];
  for (const w of windows.sort((a, b) => a.start - b.start)) {
    for (let s = w.start; s + dur <= w.end; s += dur) {
      const e = s + dur;
      if (s <= earliest) continue;
      if (blocked.some(b => b.start < e && s < b.end)) continue;
      slots.push({ startsAt: new Date(s).toISOString(), endsAt: new Date(e).toISOString(), modality: w.modality });
    }
  }
  return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
