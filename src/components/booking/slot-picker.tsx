"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { CENTER_TZ } from "@/lib/constants";
import type { Modality } from "@/lib/types";
import type { Slot } from "@/lib/scheduling/slots";

const WINDOW_DAYS = 14;

function todayInCenterTz(): string {
  return formatInTimeZone(new Date(), CENTER_TZ, "yyyy-MM-dd");
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const dayFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: CENTER_TZ,
});
const rangeFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  timeZone: CENTER_TZ,
});
const timeFormatter = new Intl.DateTimeFormat("es-CL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: CENTER_TZ,
});

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDay(dateStr: string): string {
  return capitalize(dayFormatter.format(new Date(`${dateStr}T12:00:00Z`)));
}

function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso));
}

function formatRange(from: string, to: string): string {
  const a = rangeFormatter.format(new Date(`${from}T12:00:00Z`));
  const b = rangeFormatter.format(new Date(`${to}T12:00:00Z`));
  return `${a} – ${b}`;
}

export interface SelectedSlot {
  startsAt: string;
  endsAt: string;
}

export function SlotPicker({
  professionalId,
  modality,
  onSelect,
  selectedStartsAt,
  refreshKey,
  leadMinutes,
}: {
  professionalId: string;
  modality: Modality;
  onSelect: (slot: SelectedSlot) => void;
  selectedStartsAt?: string;
  refreshKey?: number;
  leadMinutes?: number;
}) {
  const [windowStart, setWindowStart] = useState(0);
  const [days, setDays] = useState<Record<string, Slot[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => todayInCenterTz(), []);
  const from = useMemo(() => addDaysToDateStr(today, windowStart), [today, windowStart]);
  const to = useMemo(() => addDaysToDateStr(today, windowStart + WINDOW_DAYS - 1), [today, windowStart]);

  useEffect(() => {
    // Flag local al efecto (no una ref compartida): cada ejecución tiene su propia
    // bandera, así una respuesta tardía de un efecto anterior nunca puede pisar el
    // estado de una ejecución más nueva (ver guards en los callbacks de abajo).
    let cancelled = false;
    // Reset síncrono e intencional del estado de carga/error al cambiar de parámetros de búsqueda.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    const leadParam = leadMinutes !== undefined ? `&lead=${leadMinutes}` : "";
    fetch(`/api/availability?professionalId=${encodeURIComponent(professionalId)}&from=${from}&to=${to}${leadParam}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("request failed");
        return (await res.json()) as { days: Record<string, Slot[]> };
      })
      .then((data) => {
        if (!cancelled) setDays(data.days ?? {});
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos cargar los horarios disponibles. Intenta nuevamente.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [professionalId, from, to, refreshKey, leadMinutes]);

  const entries = useMemo(() => {
    return Object.entries(days)
      .map(([date, slots]) => [date, slots.filter((s) => s.modality.includes(modality))] as const)
      .filter(([, slots]) => slots.length > 0)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [days, modality]);

  function nextWindow() {
    setWindowStart((w) => w + WINDOW_DAYS);
  }
  function prevWindow() {
    setWindowStart((w) => Math.max(0, w - WINDOW_DAYS));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevWindow}
          disabled={windowStart === 0}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink transition hover:border-sage-dark hover:text-sage-dark disabled:opacity-30"
        >
          ‹ Semana anterior
        </button>
        <p className="text-sm text-ink/60">{formatRange(from, to)}</p>
        <button
          type="button"
          onClick={nextWindow}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm text-ink transition hover:border-sage-dark hover:text-sage-dark"
        >
          Semana siguiente ›
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {loading &&
          [0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="h-4 w-40 animate-pulse rounded bg-sage/15" />
              <div className="mt-3 flex gap-2">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="h-8 w-16 animate-pulse rounded-full bg-sage/10" />
                ))}
              </div>
            </div>
          ))}

        {!loading && error && (
          <p className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm">{error}</p>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-ink/60">No hay horas disponibles en estas fechas.</p>
            <button
              type="button"
              onClick={nextWindow}
              className="mt-4 rounded-full bg-sage px-5 py-2 text-sm text-white transition hover:bg-sage-dark"
            >
              Ver semana siguiente
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          entries.map(([date, slots]) => (
            <div key={date} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="font-heading text-sm text-ink">{formatDay(date)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {slots.map((slot) => {
                  const selected = slot.startsAt === selectedStartsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => onSelect({ startsAt: slot.startsAt, endsAt: slot.endsAt })}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        selected ? "bg-sage text-white" : "bg-sage/10 text-ink hover:bg-sage/20"
                      }`}
                    >
                      {formatTime(slot.startsAt)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
