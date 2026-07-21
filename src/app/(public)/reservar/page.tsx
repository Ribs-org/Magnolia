import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import { BookingWizard, type WizardProfessional } from "@/components/booking/wizard";

export const metadata: Metadata = { title: "Reserva tu hora" };

type Props = { searchParams: Promise<{ profesional?: string }> };

export default async function ReservarPage({ searchParams }: Props) {
  const { profesional } = await searchParams;
  const supabase = await createClient();

  const [{ data }, session] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, slug, specialty, photo_url, full_name, modalities, session_duration_min, session_price")
      .eq("is_active", true)
      .order("full_name"),
    getSessionProfile(),
  ]);

  const professionals = (data ?? []) as WizardProfessional[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <h1 className="font-heading text-3xl text-ink sm:text-4xl">Reserva tu hora</h1>
      <p className="mt-3 text-ink/70">
        Elige especialidad, profesional, modalidad y el horario que más te acomode.
      </p>
      <div className="mt-10">
        <BookingWizard
          professionals={professionals}
          preselectSlug={profesional}
          isAuthenticated={!!session}
        />
      </div>
    </div>
  );
}
