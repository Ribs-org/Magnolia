"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cancelMyAppointment } from "@/lib/actions/appointments";

export function CancelDialog({
  appointmentId,
  professionalSlug,
}: {
  appointmentId: string;
  professionalSlug: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [wantsReschedule, setWantsReschedule] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setWantsReschedule(false);
    }
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelMyAppointment(appointmentId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo cancelar. Intenta de nuevo.");
        return;
      }
      setOpen(false);
      if (wantsReschedule) {
        router.push(`/reservar?profesional=${encodeURIComponent(professionalSlug)}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>Cancelar cita</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar esta cita?</DialogTitle>
          <DialogDescription>
            Te avisaremos por correo que se canceló. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={wantsReschedule}
            onChange={(e) => setWantsReschedule(e.target.checked)}
            className="h-4 w-4 rounded border-ink/30 text-sage focus:ring-sage"
          />
          Cancelar y reagendar
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Volver
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Cancelando…" : "Sí, cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
