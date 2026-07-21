import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProfessionalForm } from "@/components/panel/professional-form";
import type { Professional } from "@/lib/types";

export const metadata: Metadata = { title: "Profesional" };

type Props = { params: Promise<{ id: string }> };

export default async function ProfesionalDetailPage({ params }: Props) {
  await requireRole(["admin"], "/panel/profesionales");
  const { id } = await params;

  if (id === "nuevo") {
    return (
      <div>
        <h1 className="font-heading text-3xl text-ink">Nuevo profesional</h1>
        <div className="mt-6">
          <ProfessionalForm professional={null} />
        </div>
      </div>
    );
  }

  // Solo el cliente de service-role puede leer meeting_url (columna revocada para
  // el cliente autenticado); esta página ya está protegida por requireRole(["admin"]).
  const admin = createAdminClient();
  const { data } = await admin.from("professionals").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const professional = data as Professional;

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">{professional.full_name}</h1>
      <div className="mt-6">
        <ProfessionalForm professional={professional} />
      </div>
    </div>
  );
}
