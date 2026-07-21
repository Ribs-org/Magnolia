import { describe, expect, test } from "vitest";
import { fromZonedTime } from "date-fns-tz";
import { computeDaySlots } from "@/lib/scheduling/slots";

const TZ = "America/Santiago";

// Domingo 2026-09-06: día del cambio de horario en Chile (horario de invierno UTC-4 →
// horario de verano UTC-3). El oráculo de este test se calcula con la misma librería
// tz-aware (fromZonedTime) que usa el código bajo prueba, para no tener que adivinar a
// mano en qué momento exacto del día ocurre el corte de horario.
describe("computeDaySlots — cambio de horario (spring-forward) en Chile", () => {
  const date = "2026-09-06";
  const rules = [
    { id: "r1", professional_id: "p1", weekday: 0, start_time: "10:00", end_time: "12:00", modality: "both" as const },
  ];
  const now = new Date("2026-08-01T12:00:00Z"); // bien antes del día en cuestión

  test("genera exactamente 2 slots de 60 min, en los instantes correctos y sin solaparse", () => {
    const slots = computeDaySlots({
      date,
      rules,
      exceptions: [],
      busy: [],
      durationMin: 60,
      timezone: TZ,
      now,
      minLeadMinutes: 0,
    });

    const expectedStart1 = fromZonedTime(`${date}T10:00:00`, TZ).toISOString();
    const expectedStart2 = fromZonedTime(`${date}T11:00:00`, TZ).toISOString();
    const expectedEnd2 = fromZonedTime(`${date}T12:00:00`, TZ).toISOString();

    expect(slots).toHaveLength(2);
    expect(slots[0].startsAt).toBe(expectedStart1);
    expect(slots[0].endsAt).toBe(expectedStart2);
    expect(slots[1].startsAt).toBe(expectedStart2);
    expect(slots[1].endsAt).toBe(expectedEnd2);

    // cada slot dura exactamente 60 minutos
    for (const s of slots) {
      expect(new Date(s.endsAt).getTime() - new Date(s.startsAt).getTime()).toBe(60 * 60_000);
    }

    // consecutivos y sin solaparse
    expect(slots[0].endsAt).toBe(slots[1].startsAt);
    expect(new Date(slots[0].endsAt).getTime()).toBeLessThanOrEqual(new Date(slots[1].startsAt).getTime());
  });
});
