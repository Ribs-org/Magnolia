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
import { SlotPicker, type SelectedSlot } from "@/components/booking/slot-picker";
import { adminCreateAppointment, adminSearchPatients } from "@/lib/actions/admin";
import type { Modality } from "@/lib/types";

export interface AdminAppointmentProfessional {
  id: string;
  full_name: string;
  modalities: Modality[];
}

interface PatientResult {
  id: string;
  full_name: string;
  rut: string | null;
  phone: string | null;
}

function modalityLabel(m: Modality): string {
  return m === "in_person" ? "Presencial" : "Online";
}

export function AdminAppointmentDialog({ professionals }: { professionals: AdminAppointmentProfessional[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PatientResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [patient, setPatient] = useState<PatientResult | null>(null);
  const [professionalId, setProfessionalId] = useState("");
  const [modality, setModality] = useState<Modality | "">("");
  const [slot, setSlot] = useState<SelectedSlot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const professional = professionals.find((p) => p.id === professionalId);

  function reset() {
    setQuery("");
    setResults([]);
    setPatient(null);
    setProfessionalId("");
    setModality("");
    setSlot(null);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleSearch(value: string) {
    setQuery(value);
    setError(null);
    setPatient(null);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    startTransition(async () => {
      const result = await adminSearchPatients(value);
      setSearching(false);
      if (result.ok) setResults(result.patients);
    });
  }

  function selectPatient(p: PatientResult) {
    setPatient(p);
    setResults([]);
    setQuery(p.full_name);
  }

  function selectProfessional(id: string) {
    setProfessionalId(id);
    const p = professionals.find((x) => x.id === id);
    setModality(p && p.modalities.length === 1 ? p.modalities[0] : "");
    setSlot(null);
  }

  function handleConfirm() {
    if (!patient || !professionalId || !modality || !slot) return;
    setError(null);
    startTransition(async () => {
      const result = await adminCreateAppointment({
        patientId: patient.id,
        professionalId,
        startsAt: slot.startsAt,
        modality,
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo crear la cita");
        return;
      }
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>+ Nueva cita</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
          <DialogDescription>Agenda una cita en nombre de un paciente.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink/60">Paciente</label>
            <Input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Busca por nombre, RUT o teléfono…"
              className="mt-1"
            />
            {searching && <p className="mt-1 text-xs text-ink/50">Buscando…</p>}
            {results.length > 0 && (
              <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-ink/10 bg-white">
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-sage/10"
                    >
                      {p.full_name}
                      {p.rut && <span className="text-ink/50"> · {p.rut}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {patient && <p className="mt-1 text-xs text-sage-dark">Seleccionado: {patient.full_name}</p>}
          </div>

          <div>
            <label className="text-xs text-ink/60">Profesional</label>
            <select
              value={professionalId}
              onChange={(e) => selectProfessional(e.target.value)}
              className="mt-1 h-8 w-full rounded-lg border border-ink/15 bg-white px-2 text-sm text-ink"
            >
              <option value="">Selecciona…</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>

          {professional && professional.modalities.length > 1 && (
            <div>
              <label className="text-xs text-ink/60">Modalidad</label>
              <div className="mt-1 flex gap-2">
                {professional.modalities.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setModality(m);
                      setSlot(null);
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm transition ${
                      modality === m ? "bg-sage text-white" : "bg-sage/10 text-ink"
                    }`}
                  >
                    {modalityLabel(m)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {patient && professionalId && modality && (
            <div>
              <label className="text-xs text-ink/60">Fecha y hora</label>
              <div className="mt-1">
                <SlotPicker
                  professionalId={professionalId}
                  modality={modality}
                  onSelect={setSlot}
                  selectedStartsAt={slot?.startsAt}
                  leadMinutes={0}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-700">{error}</p>}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isPending || !slot}>
            {isPending ? "Creando…" : "Crear cita"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
