import { describe, expect, test } from "vitest";
import { computeDaySlots } from "@/lib/scheduling/slots";

const TZ = "America/Santiago";
// Lunes 2026-08-03. En agosto Chile está en UTC-4 → 10:00 local = 14:00Z.
const base = {
  date: "2026-08-03",
  rules: [{ id: "r1", professional_id: "p1", weekday: 1, start_time: "10:00", end_time: "13:00", modality: "both" as const }],
  exceptions: [], busy: [], durationMin: 60, timezone: TZ,
  now: new Date("2026-08-01T12:00:00Z"), minLeadMinutes: 0,
};

describe("computeDaySlots", () => {
  test("accepts Postgres HH:MM:SS time format (regression)", () => {
    const slots = computeDaySlots({
      ...base,
      rules: [{ ...base.rules[0], start_time: "10:00:00", end_time: "13:00:00" }],
    });
    expect(slots.map(s => s.startsAt)).toEqual([
      "2026-08-03T14:00:00.000Z", "2026-08-03T15:00:00.000Z", "2026-08-03T16:00:00.000Z",
    ]);
  });

  test("generates consecutive slots from a rule", () => {
    const slots = computeDaySlots(base);
    expect(slots.map(s => s.startsAt)).toEqual([
      "2026-08-03T14:00:00.000Z", "2026-08-03T15:00:00.000Z", "2026-08-03T16:00:00.000Z",
    ]);
    expect(slots[0].endsAt).toBe("2026-08-03T15:00:00.000Z");
  });

  test("no rule for weekday → empty", () => {
    expect(computeDaySlots({ ...base, date: "2026-08-04" })).toEqual([]); // martes
  });

  test("excludes slots overlapping existing appointments", () => {
    const slots = computeDaySlots({ ...base, busy: [{ starts_at: "2026-08-03T15:00:00.000Z", ends_at: "2026-08-03T16:00:00.000Z" }] });
    expect(slots.map(s => s.startsAt)).toEqual(["2026-08-03T14:00:00.000Z", "2026-08-03T16:00:00.000Z"]);
  });

  test("full-day blocked exception removes everything", () => {
    const slots = computeDaySlots({ ...base, exceptions: [{ id: "e", professional_id: "p1", date: "2026-08-03", start_time: null, end_time: null, kind: "blocked", reason: null }] });
    expect(slots).toEqual([]);
  });

  test("partial block removes only overlapped slots", () => {
    const slots = computeDaySlots({ ...base, exceptions: [{ id: "e", professional_id: "p1", date: "2026-08-03", start_time: "10:00", end_time: "11:00", kind: "blocked", reason: null }] });
    expect(slots.map(s => s.startsAt)).toEqual(["2026-08-03T15:00:00.000Z", "2026-08-03T16:00:00.000Z"]);
  });

  test("extra_open adds a window on a day without rules", () => {
    const slots = computeDaySlots({ ...base, date: "2026-08-04", exceptions: [{ id: "e", professional_id: "p1", date: "2026-08-04", start_time: "09:00", end_time: "11:00", kind: "extra_open", reason: null }] });
    expect(slots.map(s => s.startsAt)).toEqual(["2026-08-04T13:00:00.000Z", "2026-08-04T14:00:00.000Z"]);
  });

  test("past slots are filtered relative to now + lead", () => {
    const slots = computeDaySlots({ ...base, now: new Date("2026-08-03T14:30:00Z"), minLeadMinutes: 30 });
    expect(slots.map(s => s.startsAt)).toEqual(["2026-08-03T16:00:00.000Z"]);
  });

  test("slot that would exceed window end is not generated", () => {
    const slots = computeDaySlots({ ...base, durationMin: 90 });
    expect(slots.map(s => s.startsAt)).toEqual(["2026-08-03T14:00:00.000Z", "2026-08-03T15:30:00.000Z"]);
  });
});
