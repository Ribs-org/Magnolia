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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCreatePatient } from "@/lib/actions/admin";

const emptyForm = { fullName: "", rut: "", phone: "", email: "" };

export function NewPatientDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setForm(emptyForm);
      setError(null);
    }
  }

  function handleCreate() {
    setError(null);
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Nombre y email son obligatorios");
      return;
    }
    startTransition(async () => {
      const result = await adminCreatePatient({
        fullName: form.fullName.trim(),
        rut: form.rut.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim(),
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo crear el paciente");
        return;
      }
      setOpen(false);
      setForm(emptyForm);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>+ Nuevo paciente</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
          <DialogDescription>
            Se creará una cuenta para el paciente. Podrá acceder usando &ldquo;recuperar contraseña&rdquo; con su email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="np-name">Nombre completo</Label>
            <Input
              id="np-name"
              className="mt-1"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="np-email">Email</Label>
            <Input
              id="np-email"
              type="email"
              className="mt-1"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="np-rut">RUT</Label>
            <Input
              id="np-rut"
              className="mt-1"
              value={form.rut}
              onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="np-phone">Teléfono</Label>
            <Input
              id="np-phone"
              className="mt-1"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleCreate} disabled={isPending}>
            {isPending ? "Creando…" : "Crear paciente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
