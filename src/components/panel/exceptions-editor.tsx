"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { addException, deleteException } from "@/lib/actions/availability";
import type { AvailabilityException } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "long" });

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

const fieldClass = "h-8 rounded-lg border border-ink/15 bg-white px-2 text-sm text-ink";

export function ExceptionsEditor({
  professionalId,
  exceptions,
}: {
  professionalId: string;
  exceptions: AvailabilityException[];
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [kind, setKind] = useState<"blocked" | "extra_open">("blocked");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    if (!date) {
      setError("Indica una fecha");
      return;
    }
    if (kind === "extra_open" && (!startTime || !endTime)) {
      setError("Una apertura extra requiere horario");
      return;
    }
    if ((startTime && !endTime) || (!startTime && endTime)) {
      setError("Indica ambas horas o ninguna");
      return;
    }
    setDeletingId(null);
    startTransition(async () => {
      const result = await addException({
        professionalId,
        date,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        kind,
        reason: reason.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar");
        return;
      }
      setDate("");
      setStartTime("");
      setEndTime("");
      setReason("");
      router.refresh();
    });
  }

  function handleDelete(exceptionId: string) {
    setError(null);
    setDeletingId(exceptionId);
    startTransition(async () => {
      const result = await deleteException(exceptionId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar");
        setDeletingId(null);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {exceptions.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-ink/70 shadow-sm">
          No hay bloqueos ni aperturas programadas.
        </p>
      ) : (
        <ul className="space-y-2">
          {exceptions.map((ex) => (
            <li
              key={ex.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm text-ink">
                  {capitalize(dateFormatter.format(new Date(`${ex.date}T12:00:00Z`)))}
                  <span className="ml-2 text-ink/50">
                    {ex.start_time && ex.end_time
                      ? `${formatTime(ex.start_time)}–${formatTime(ex.end_time)}`
                      : "Todo el día"}
                  </span>
                </p>
                {ex.reason && <p className="mt-1 text-xs text-ink/50">{ex.reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    ex.kind === "blocked" ? "bg-red-100 text-red-700" : "bg-sage/15 text-sage-dark"
                  }`}
                >
                  {ex.kind === "blocked" ? "Bloqueo" : "Apertura extra"}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isPending && deletingId === ex.id}
                  onClick={() => handleDelete(ex.id)}
                >
                  {isPending && deletingId === ex.id ? "Eliminando…" : "Eliminar"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-ink/20 p-4">
        <h3 className="font-heading text-sm text-ink">Agregar bloqueo o apertura</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Tipo
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "blocked" | "extra_open")}
              className={fieldClass}
            >
              <option value="blocked">Bloqueo</option>
              <option value="extra_open">Apertura extra</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Desde {kind === "blocked" && <span className="text-ink/40">(opcional)</span>}
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Hasta {kind === "blocked" && <span className="text-ink/40">(opcional)</span>}
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={fieldClass} />
          </label>
          <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs text-ink/60">
            Motivo <span className="text-ink/40">(opcional)</span>
            <input
              type="text"
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              className={fieldClass}
            />
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
