"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEAM_PHOTOS_BUCKET, TEAM_SETTINGS_KEY, teamListSchema, type TeamMember } from "@/lib/team";

const PHOTO_MAX_BYTES = 8 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function adminSaveTeam(
  members: TeamMember[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireRole(["admin"]);
  const parsed = teamListSchema.safeParse(members);
  if (!parsed.success) return { ok: false, error: "Datos del equipo inválidos" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("settings")
    .upsert({ key: TEAM_SETTINGS_KEY, value: JSON.stringify(parsed.data) });
  if (error) return { ok: false, error: "No se pudo guardar el equipo" };

  revalidatePath("/");
  revalidatePath("/panel/equipo");
  return { ok: true };
}

export async function adminUploadTeamPhoto(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  await requireRole(["admin"]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Selecciona una imagen" };
  }
  const ext = PHOTO_TYPES[file.type];
  if (!ext) return { ok: false, error: "Formato no soportado: usa JPG, PNG o WebP" };
  if (file.size > PHOTO_MAX_BYTES) return { ok: false, error: "La imagen no puede superar 8 MB" };

  const admin = createAdminClient();

  // Crea el bucket público la primera vez; si ya existe, seguimos.
  const { data: bucket } = await admin.storage.getBucket(TEAM_PHOTOS_BUCKET);
  if (!bucket) {
    const { error: bucketErr } = await admin.storage.createBucket(TEAM_PHOTOS_BUCKET, {
      public: true,
      fileSizeLimit: PHOTO_MAX_BYTES,
      allowedMimeTypes: Object.keys(PHOTO_TYPES),
    });
    if (bucketErr && !bucketErr.message.toLowerCase().includes("already exists")) {
      return { ok: false, error: "No se pudo preparar el almacenamiento de fotos" };
    }
  }

  const path = `${randomUUID()}.${ext}`;
  const { error: uploadErr } = await admin.storage
    .from(TEAM_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (uploadErr) return { ok: false, error: "No se pudo subir la imagen" };

  const { data } = admin.storage.from(TEAM_PHOTOS_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
