"use client";

import { useState } from "react";
import { CENTER_TZ } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NewPatientDialog } from "@/components/panel/new-patient-dialog";
import type { AppointmentStatus, Modality } from "@/lib/types";

export interface PacienteRow {
  id: string;
  full_name: string;
  rut: string | null;
  phone: string | null;
}

export interface PacienteAppointment {
  id: string;
  patient_id: string;
  starts_at: string;
  status: AppointmentStatus;
  modality: Modality;
  professional?: { full_name: string } | null;
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: CENTER_TZ,
});

function statusLabel(status: AppointmentStatus): string {
  switch (status) {
    case "confirmed":
      return "Confirmada";
    case "completed":
      return "Completada";
    case "no_show":
      return "No asistió";
    case "cancelled_by_patient":
    case "cancelled_by_center":
      return "Cancelada";
  }
}

export function PacientesTable({
  patients,
  appointmentsByPatient,
  initialQuery,
}: {
  patients: PacienteRow[];
  appointmentsByPatient: Record<string, PacienteAppointment[]>;
  initialQuery: string;
}) {
  const [selected, setSelected] = useState<PacienteRow | null>(null);
  const selectedAppointments = selected ? (appointmentsByPatient[selected.id] ?? []) : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex items-center gap-2">
          <Input
            name="q"
            defaultValue={initialQuery}
            placeholder="Buscar por nombre, RUT o teléfono…"
            className="w-64"
          />
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>
        <NewPatientDialog />
      </div>

      <div className="mt-4 rounded-xl bg-white p-2 shadow-sm">
        {patients.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/60">No se encontraron pacientes.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Nº de citas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelected(p)}>
                  <TableCell className="font-medium text-ink">{p.full_name}</TableCell>
                  <TableCell>{p.rut ?? "—"}</TableCell>
                  <TableCell>{p.phone ?? "—"}</TableCell>
                  <TableCell>{appointmentsByPatient[p.id]?.length ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedAppointments.length > 0 ? (
              selectedAppointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-cream px-3 py-2 text-sm">
                  <div>
                    <p className="text-ink">{dateFormatter.format(new Date(a.starts_at))}</p>
                    <p className="text-xs text-ink/50">
                      {a.professional?.full_name ?? "—"} · {a.modality === "in_person" ? "Presencial" : "Online"}
                    </p>
                  </div>
                  <span className="text-xs text-ink/60">{statusLabel(a.status)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-ink/60">Este paciente no tiene citas registradas.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
