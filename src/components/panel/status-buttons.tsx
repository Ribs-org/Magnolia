"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setAppointmentStatus } from "@/lib/actions/appointments";
import type { AppointmentStatus } from "@/lib/types";

export function StatusButtons({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<"completed" | "no_show" | null>(null);
  const [isPending, startTransition] = useTransition();

  if (status !== "confirmed") return null;

  function apply(next: "completed" | "no_show") {
    setError(null);
    setPendingStatus(next);
    startTransition(async () => {
      const result = await setAppointmentStatus(appointmentId, next);
      if (!result.ok) {
        setError(result.error ?? "No se pudo actualizar");
        setPendingStatus(null);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => apply("completed")}>
        {isPending && pendingStatus === "completed" ? "Guardando…" : "Completada"}
      </Button>
      <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => apply("no_show")}>
        {isPending && pendingStatus === "no_show" ? "Guardando…" : "No asistió"}
      </Button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  );
}
