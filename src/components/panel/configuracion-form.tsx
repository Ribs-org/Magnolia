"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSetting } from "@/lib/actions/admin";

interface Settings {
  cancellation_window_hours: string;
  center_phone: string;
  center_email: string;
  center_address: string;
}

export function ConfiguracionForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState<Settings>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function set<K extends keyof Settings>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    const changed = (Object.keys(values) as (keyof Settings)[]).filter((key) => values[key] !== initial[key]);
    if (changed.length === 0) {
      setSaved(true);
      return;
    }
    startTransition(async () => {
      const results = await Promise.all(changed.map((key) => updateSetting(key, values[key])));
      const failed = results.find((r) => !r.ok);
      if (failed) {
        setError(failed.error ?? "No se pudo guardar la configuración");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="max-w-xl space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <Label htmlFor="cf-window">Ventana de cancelación (horas)</Label>
        <Input
          id="cf-window"
          type="number"
          min={1}
          className="mt-1"
          value={values.cancellation_window_hours}
          onChange={(e) => set("cancellation_window_hours", e.target.value)}
        />
        <p className="mt-1 text-xs text-ink/50">
          Los pacientes no podrán cancelar ni reagendar con menos de estas horas de anticipación.
        </p>
      </div>

      <div>
        <Label htmlFor="cf-phone">Teléfono del centro</Label>
        <Input
          id="cf-phone"
          className="mt-1"
          value={values.center_phone}
          onChange={(e) => set("center_phone", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="cf-email">Email del centro</Label>
        <Input
          id="cf-email"
          type="email"
          className="mt-1"
          value={values.center_email}
          onChange={(e) => set("center_email", e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="cf-address">Dirección del centro</Label>
        <Input
          id="cf-address"
          className="mt-1"
          value={values.center_address}
          onChange={(e) => set("center_address", e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="text-sm text-sage-dark">Guardado.</p>}

      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </div>
  );
}
