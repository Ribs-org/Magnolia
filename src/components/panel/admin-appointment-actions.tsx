"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SlotPicker, type SelectedSlot } from "@/components/booking/slot-picker";
import { adminCancelAppointment, adminMoveAppointment } from "@/lib/actions/admin";
import type { Modality } from "@/lib/types";

export function AdminAppointmentActions({
  appointmentId,
  professionalId,
  modality,
}: {
  appointmentId: string;
  professionalId: string;
  modality: Modality;
}) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [slot, setSlot] = useState<SelectedSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await adminCancelAppointment(appointmentId);
      if (!result.ok) {
        setError(result.error ?? "No se pudo cancelar");
        return;
      }
      setCancelOpen(false);
      router.refresh();
    });
  }

  function handleMove() {
    if (!slot) return;
    setError(null);
    startTransition(async () => {
      const result = await adminMoveAppointment(appointmentId, slot.startsAt);
      if (!result.ok) {
        setError(result.error ?? "No se pudo mover la cita");
        return;
      }
      setMoveOpen(false);
      setSlot(null);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>Acciones</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setMoveOpen(true)}>Mover</DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
            Cancelar (centro)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={cancelOpen}
        onOpenChange={(v) => {
          setCancelOpen(v);
          if (!v) setError(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar esta cita?</DialogTitle>
            <DialogDescription>
              Se avisará al paciente por correo que el centro canceló su cita. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setCancelOpen(false)} disabled={isPending}>
              Volver
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancel} disabled={isPending}>
              {isPending ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={moveOpen}
        onOpenChange={(v) => {
          setMoveOpen(v);
          if (!v) {
            setSlot(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mover cita</DialogTitle>
            <DialogDescription>Elige el nuevo horario. Se avisará al paciente por correo.</DialogDescription>
          </DialogHeader>
          <SlotPicker
            professionalId={professionalId}
            modality={modality}
            onSelect={setSlot}
            selectedStartsAt={slot?.startsAt}
            leadMinutes={0}
          />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setMoveOpen(false)} disabled={isPending}>
              Volver
            </Button>
            <Button type="button" onClick={handleMove} disabled={isPending || !slot}>
              {isPending ? "Guardando…" : "Confirmar nuevo horario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
