"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { specialtyLabel } from "@/components/site/professional-card";
import { adminUpsertProfessional } from "@/lib/actions/admin";
import type { Modality, Professional, Specialty } from "@/lib/types";

const SPECIALTIES: Specialty[] = ["psychologist", "psychiatrist"];
const MODALITIES: Modality[] = ["in_person", "online"];

function modalityLabel(m: Modality): string {
  return m === "in_person" ? "Presencial" : "Online";
}

export function ProfessionalForm({ professional }: { professional: Professional | null }) {
  const router = useRouter();
  const isNew = professional === null;

  const [fullName, setFullName] = useState(professional?.full_name ?? "");
  const [email, setEmail] = useState("");
  const [slug, setSlug] = useState(professional?.slug ?? "");
  const [specialty, setSpecialty] = useState<Specialty>(professional?.specialty ?? "psychologist");
  const [bio, setBio] = useState(professional?.bio ?? "");
  const [modalities, setModalities] = useState<Modality[]>(professional?.modalities ?? ["in_person"]);
  const [sessionDurationMin, setSessionDurationMin] = useState(String(professional?.session_duration_min ?? 50));
  const [sessionPrice, setSessionPrice] = useState(String(professional?.session_price ?? 0));
  const [meetingUrl, setMeetingUrl] = useState(professional?.meeting_url ?? "");
  const [photoUrl, setPhotoUrl] = useState(professional?.photo_url ?? "");
  const [isActive, setIsActive] = useState(professional?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleModality(m: Modality) {
    setModalities((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await adminUpsertProfessional({
        profileId: professional?.profile_id,
        email: isNew ? email.trim() : undefined,
        fullName: fullName.trim(),
        slug: slug.trim(),
        specialty,
        bio,
        modalities,
        sessionDurationMin: Number(sessionDurationMin),
        sessionPrice: Number(sessionPrice),
        meetingUrl: meetingUrl.trim() || null,
        photoUrl: photoUrl.trim() || null,
        isActive,
      });
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar el profesional");
        return;
      }
      if (isNew && result.professionalId) {
        router.push(`/panel/profesionales/${result.professionalId}`);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="max-w-2xl space-y-5 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <Label htmlFor="pf-name">Nombre completo</Label>
        <Input id="pf-name" className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>

      {isNew && (
        <div>
          <Label htmlFor="pf-email">Email</Label>
          <Input
            id="pf-email"
            type="email"
            className="mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink/50">
            Se creará una cuenta; el profesional entra con &ldquo;recuperar contraseña&rdquo;.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="pf-slug">URL pública (slug)</Label>
        <Input
          id="pf-slug"
          className="mt-1"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ej: maria-perez"
        />
      </div>

      <div>
        <Label htmlFor="pf-specialty">Especialidad</Label>
        <select
          id="pf-specialty"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value as Specialty)}
          className="mt-1 h-8 w-full rounded-lg border border-ink/15 bg-white px-2 text-sm text-ink"
        >
          {SPECIALTIES.map((s) => (
            <option key={s} value={s}>
              {specialtyLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="pf-bio">Biografía</Label>
        <Textarea id="pf-bio" className="mt-1" rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div>
        <Label>Modalidades</Label>
        <div className="mt-1 flex gap-4">
          {MODALITIES.map((m) => (
            <label key={m} className="flex items-center gap-2 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={modalities.includes(m)}
                onChange={() => toggleModality(m)}
                className="h-4 w-4 rounded border-ink/30 text-sage focus:ring-sage"
              />
              {modalityLabel(m)}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="pf-duration">Duración de sesión (min)</Label>
          <Input
            id="pf-duration"
            type="number"
            min={15}
            max={180}
            className="mt-1"
            value={sessionDurationMin}
            onChange={(e) => setSessionDurationMin(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="pf-price">Precio (CLP)</Label>
          <Input
            id="pf-price"
            type="number"
            min={0}
            className="mt-1"
            value={sessionPrice}
            onChange={(e) => setSessionPrice(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="pf-meeting">Link de videollamada</Label>
        <Input
          id="pf-meeting"
          className="mt-1"
          value={meetingUrl}
          onChange={(e) => setMeetingUrl(e.target.value)}
          placeholder="https://meet.google.com/…"
        />
      </div>

      <div>
        <Label htmlFor="pf-photo">Foto (URL)</Label>
        <Input
          id="pf-photo"
          className="mt-1"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 rounded border-ink/30 text-sage focus:ring-sage"
        />
        Activo (visible en el sitio público)
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {saved && !error && <p className="text-sm text-sage-dark">Guardado.</p>}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar"}
        </Button>
        {!isNew && professional && (
          <Link
            href={`/panel/disponibilidad?profesional=${professional.id}`}
            className="text-sm text-sage-dark hover:underline"
          >
            Ver disponibilidad ›
          </Link>
        )}
      </div>
    </div>
  );
}
