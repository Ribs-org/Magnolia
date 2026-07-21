import Link from "next/link";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { specialtyLabel } from "@/components/site/professional-card";
import type { Professional } from "@/lib/types";

export const metadata: Metadata = { title: "Profesionales" };

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

export default async function ProfesionalesPage() {
  await requireRole(["admin"], "/panel/profesionales");
  const supabase = await createClient();
  const { data } = await supabase
    .from("professionals")
    .select("id, full_name, slug, specialty, session_price, is_active")
    .order("full_name", { ascending: true });
  const professionals = (data ?? []) as Pick<Professional, "id" | "full_name" | "slug" | "specialty" | "session_price" | "is_active">[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-ink">Profesionales</h1>
        <Button render={<Link href="/panel/profesionales/nuevo" />}>+ Nuevo profesional</Button>
      </div>

      <div className="mt-6 rounded-xl bg-white p-2 shadow-sm">
        {professionals.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink/60">Aún no hay profesionales.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead>Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professionals.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/panel/profesionales/${p.id}`} className="text-sage-dark hover:underline">
                      {p.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>{specialtyLabel(p.specialty)}</TableCell>
                  <TableCell>{p.is_active ? "Sí" : "No"}</TableCell>
                  <TableCell>{formatPrice(p.session_price)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
