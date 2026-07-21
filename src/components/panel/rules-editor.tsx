"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addRule, deleteRule } from "@/lib/actions/availability";
import type { AvailabilityRule, Modality } from "@/lib/types";

const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const MODALITY_LABEL: Record<string, string> = {
  in_person: "Presencial",
  online: "Online",
  both: "Ambas",
};

function formatTime(t: string): string {
  return t.slice(0, 5);
}

const fieldClass = "h-8 rounded-lg border border-ink/15 bg-white px-2 text-sm text-ink";

export function RulesEditor({
  professionalId,
  rules,
}: {
  professionalId: string;
  rules: AvailabilityRule[];
}) {
  const router = useRouter();
  const [weekday, setWeekday] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [modality, setModality] = useState<Modality | "both">("both");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = new Map<number, AvailabilityRule[]>();
  for (const r of rules) {
    if (!grouped.has(r.weekday)) grouped.set(r.weekday, []);
    grouped.get(r.weekday)!.push(r);
  }
  for (const list of grouped.values()) list.sort((a, b) => a.start_time.localeCompare(b.start_time));

  function handleAdd() {
    setError(null);
    if (!startTime || !endTime) {
      setError("Indica hora de inicio y término");
      return;
    }
    setDeletingId(null);
    startTransition(async () => {
      const result = await addRule({
        professionalId,
        weekday: Number(weekday),
        startTime,
        endTime,
        modality,
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar el horario");
        return;
      }
      setStartTime("");
      setEndTime("");
      router.refresh();
    });
  }

  function handleDelete(ruleId: string) {
    setError(null);
    setDeletingId(ruleId);
    startTransition(async () => {
      const result = await deleteRule(ruleId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar el horario");
        setDeletingId(null);
        return;
      }
      router.refresh();
    });
  }

  const hasRules = rules.length > 0;

  return (
    <div className="space-y-4">
      {!hasRules ? (
        <p className="rounded-xl bg-white p-6 text-center text-ink/70 shadow-sm">
          Aún no tienes horarios configurados. Agrega uno abajo.
        </p>
      ) : (
        <div className="space-y-4">
          {WEEKDAYS.map(({ value, label }) => {
            const dayRules = grouped.get(value);
            if (!dayRules || dayRules.length === 0) return null;
            return (
              <div key={value} className="rounded-xl bg-white p-4 shadow-sm">
                <h3 className="font-heading text-base text-ink">{label}</h3>
                <ul className="mt-2 space-y-2">
                  {dayRules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-ink/80">
                        {formatTime(r.start_time)}–{formatTime(r.end_time)}{" "}
                        <span className="text-ink/50">· {MODALITY_LABEL[r.modality]}</span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending && deletingId === r.id}
                        onClick={() => handleDelete(r.id)}
                      >
                        {isPending && deletingId === r.id ? "Eliminando…" : "Eliminar"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-ink/20 p-4">
        <h3 className="font-heading text-sm text-ink">Agregar horario</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Día
            <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className={fieldClass}>
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Desde
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Hasta
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Modalidad
            <select
              value={modality}
              onChange={(e) => setModality(e.target.value as Modality | "both")}
              className={fieldClass}
            >
              <option value="both">Ambas</option>
              <option value="in_person">Presencial</option>
              <option value="online">Online</option>
            </select>
          </label>
          <Button type="button" onClick={handleAdd} disabled={isPending}>
            {isPending && !deletingId ? "Guardando…" : "Agregar"}
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
