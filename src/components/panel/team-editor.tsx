"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminSaveTeam, adminUploadTeamPhoto } from "@/lib/actions/team";
import type { TeamMember } from "@/lib/team";

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter((part) => part.length > 1 && !part.includes("."))
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function MemberPhotoField({
  member,
  onUploaded,
}: {
  member: TeamMember;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await adminUploadTeamPhoto(formData);
      if (result.ok) {
        onUploaded(result.url);
      } else {
        setError(result.error);
      }
    } catch {
      setError("No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {member.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.photo_url}
          alt={member.name}
          className="h-24 w-24 rounded-full border border-ink/10 object-cover"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-petal/50 font-heading text-2xl text-plum">
          {initialsOf(member.name) || "?"}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="rounded-full border border-ink/15 px-3 py-1 text-xs text-ink/70 transition hover:bg-ink/5 hover:text-ink disabled:opacity-50"
      >
        {uploading ? "Subiendo…" : member.photo_url ? "Cambiar foto" : "Subir foto"}
      </button>
      {member.photo_url && (
        <button
          type="button"
          onClick={() => onUploaded("")}
          className="text-xs text-ink/50 hover:text-red-700"
        >
          Quitar foto
        </button>
      )}
      {error && <p className="max-w-40 text-center text-xs text-red-700">{error}</p>}
    </div>
  );
}

export function TeamEditor({ initialTeam }: { initialTeam: TeamMember[] }) {
  const [members, setMembers] = useState<TeamMember[]>(initialTeam);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateMember(id: string, patch: Partial<TeamMember>) {
    setSaved(false);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function move(id: string, delta: -1 | 1) {
    setSaved(false);
    setMembers((prev) => {
      const index = prev.findIndex((m) => m.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function remove(id: string) {
    setSaved(false);
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function add() {
    setSaved(false);
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", specialty: "", photo_url: null, bio: "", visible: true },
    ]);
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    const incomplete = members.find((m) => !m.name.trim());
    if (incomplete) {
      setError("Hay un integrante sin nombre: complétalo o elimínalo antes de guardar.");
      return;
    }
    startTransition(async () => {
      const result = await adminSaveTeam(
        members.map((m) => ({ ...m, name: m.name.trim(), specialty: m.specialty.trim(), bio: m.bio.trim() }))
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {members.map((member, index) => (
          <div key={member.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row">
              <MemberPhotoField
                member={member}
                onUploaded={(url) => updateMember(member.id, { photo_url: url || null })}
              />
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor={`name-${member.id}`}>Nombre</Label>
                    <Input
                      id={`name-${member.id}`}
                      className="mt-1"
                      value={member.name}
                      onChange={(e) => updateMember(member.id, { name: e.target.value })}
                      placeholder="Dra. Nombre Apellido"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`specialty-${member.id}`}>Especialidad</Label>
                    <Input
                      id={`specialty-${member.id}`}
                      className="mt-1"
                      value={member.specialty}
                      onChange={(e) => updateMember(member.id, { specialty: e.target.value })}
                      placeholder="Psiquiatría, Psicología, Terapia ocupacional…"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`bio-${member.id}`}>Reseña</Label>
                  <Textarea
                    id={`bio-${member.id}`}
                    className="mt-1"
                    rows={3}
                    value={member.bio}
                    onChange={(e) => updateMember(member.id, { bio: e.target.value })}
                    placeholder="Breve presentación que se muestra bajo el nombre (opcional)"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-ink/80">
                    <input
                      type="checkbox"
                      checked={member.visible}
                      onChange={(e) => updateMember(member.id, { visible: e.target.checked })}
                      className="h-4 w-4 rounded border-ink/30 text-sage focus:ring-sage"
                    />
                    Visible en el sitio
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(member.id, -1)}
                      disabled={index === 0}
                      aria-label={`Subir a ${member.name || "integrante"}`}
                      className="rounded-full p-2 text-ink/50 transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(member.id, 1)}
                      disabled={index === members.length - 1}
                      aria-label={`Bajar a ${member.name || "integrante"}`}
                      className="rounded-full p-2 text-ink/50 transition hover:bg-ink/5 hover:text-ink disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(member.id)}
                      aria-label={`Eliminar a ${member.name || "integrante"}`}
                      className="rounded-full p-2 text-ink/50 transition hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="mr-1 h-4 w-4" aria-hidden /> Agregar integrante
        </Button>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && !error && <p className="text-sm text-sage-dark">Guardado. Los cambios ya están en el sitio.</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
