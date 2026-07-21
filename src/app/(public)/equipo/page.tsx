import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ProfessionalCard } from "@/components/site/professional-card";
import type { Professional } from "@/lib/types";

export const metadata: Metadata = { title: "Nuestro equipo" };

export default async function EquipoPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("id, slug, specialty, photo_url, full_name")
    .eq("is_active", true)
    .order("created_at");
  const team = (data ?? []) as Professional[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-heading text-4xl text-ink sm:text-5xl">Nuestro equipo</h1>
        <p className="mt-5 text-ink/70">
          Psicólogos y psiquiatras que te acompañan con calidez y experiencia, presencial u online.
        </p>
      </div>

      {team.length > 0 ? (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((p) => (
            <ProfessionalCard key={p.id} p={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-ink/60">Pronto presentaremos a nuestro equipo.</p>
      )}
    </div>
  );
}
