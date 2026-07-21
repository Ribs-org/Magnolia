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
import { Textarea } from "@/components/ui/textarea";
import { saveSessionNote } from "@/lib/actions/notes";

export function NoteEditor({
  appointmentId,
  initialBody,
}: {
  appointmentId: string;
  initialBody: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setError(null);
      setBody(initialBody);
    }
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveSessionNote(appointmentId, body);
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar la nota");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        {initialBody ? "Ver nota" : "Agregar nota"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nota de sesión</DialogTitle>
          <DialogDescription>
            Esta nota es privada: solo tú puedes verla. No es visible para el paciente ni para administración.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          maxLength={20000}
          placeholder="Escribe tus observaciones de la sesión…"
        />

        {error && <p className="text-sm text-red-700">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cerrar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar nota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
