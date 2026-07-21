import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ConfiguracionForm } from "@/components/panel/configuracion-form";
import { CENTER_ADDRESS, CENTER_EMAIL, CENTER_PHONE } from "@/lib/constants";

export const metadata: Metadata = { title: "Configuración" };

export default async function ConfiguracionPage() {
  await requireRole(["admin"], "/panel/configuracion");
  const supabase = await createClient();
  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["cancellation_window_hours", "center_phone", "center_email", "center_address"]);

  const map = Object.fromEntries((data ?? []).map((s) => [s.key, s.value]));

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Configuración</h1>
      <p className="mt-2 text-ink/70">Estos valores se usan en todo el sitio y en los correos a pacientes.</p>
      <div className="mt-6">
        <ConfiguracionForm
          initial={{
            cancellation_window_hours: map.cancellation_window_hours ?? "24",
            center_phone: map.center_phone ?? CENTER_PHONE,
            center_email: map.center_email ?? CENTER_EMAIL,
            center_address: map.center_address ?? CENTER_ADDRESS,
          }}
        />
      </div>
    </div>
  );
}
