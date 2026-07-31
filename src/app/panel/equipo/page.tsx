import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { getTeam } from "@/lib/team";
import { TeamEditor } from "@/components/panel/team-editor";

export const metadata: Metadata = { title: "Equipo del sitio" };

export default async function EquipoPanelPage() {
  await requireRole(["admin"], "/panel/equipo");
  const team = await getTeam();

  return (
    <div>
      <h1 className="font-heading text-3xl text-ink">Equipo del sitio</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/60">
        Estos profesionales aparecen en la sección &ldquo;Nuestro equipo&rdquo; de la portada. Sube la
        foto y escribe la reseña de cada uno; al guardar, los cambios quedan publicados de inmediato.
      </p>
      <div className="mt-6">
        <TeamEditor initialTeam={team} />
      </div>
    </div>
  );
}
