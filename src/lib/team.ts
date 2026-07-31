import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Equipo de profesionales que se muestra en la portada.
 *
 * La lista editable vive en la tabla `settings` (key `team_members`) como JSON
 * y se administra desde /panel/equipo (fotos en el bucket público `equipo` de
 * Supabase Storage). Mientras el admin no guarde nada, se usa DEFAULT_TEAM
 * (nombres reales tomados de la agenda Reservo).
 */
export const TEAM_SETTINGS_KEY = "team_members";
export const TEAM_PHOTOS_BUCKET = "equipo";

export const teamMemberSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  specialty: z.string(),
  photo_url: z.string().nullable(),
  bio: z.string(),
  visible: z.boolean(),
});

export type TeamMember = z.infer<typeof teamMemberSchema>;

export const teamListSchema = z.array(teamMemberSchema);

export const DEFAULT_TEAM: TeamMember[] = [
  { id: "shirley-jones", name: "Dra. Shirley Jones B.", specialty: "Psiquiatría", photo_url: null, bio: "", visible: true },
  { id: "veronica-ramirez", name: "Dra. Verónica Ramírez Corsi", specialty: "Psiquiatría", photo_url: null, bio: "", visible: true },
  { id: "natalia-franco", name: "Dra. Natalia Franco Yañez", specialty: "Psiquiatría", photo_url: null, bio: "", visible: true },
  { id: "constanza-echeverria", name: "Dra. Constanza Echeverría R.", specialty: "Psiquiatría", photo_url: null, bio: "", visible: true },
  { id: "victoria-collins", name: "Dra. Victoria Collins Silva", specialty: "Psiquiatría", photo_url: null, bio: "", visible: true },
  { id: "constanza-gonzalez", name: "Dra. Constanza González", specialty: "Psiquiatría", photo_url: null, bio: "", visible: true },
  { id: "luz-franco", name: "Luz Franco Yañez", specialty: "Psicología", photo_url: null, bio: "", visible: true },
  { id: "felipe-castillo", name: "Felipe Castillo", specialty: "Psicología de adultos", photo_url: null, bio: "", visible: true },
  { id: "jose-luis-cortes", name: "José Luis Cortés", specialty: "Psicología", photo_url: null, bio: "", visible: true },
  { id: "daniela-espinosa", name: "Daniela Espinosa", specialty: "Psicología", photo_url: null, bio: "", visible: true },
  { id: "sue-jones", name: "Sue Jones", specialty: "Terapia ocupacional", photo_url: null, bio: "", visible: true },
];

/**
 * Lee el equipo con el cliente anónimo (sin cookies), para que la portada
 * pueda seguir siendo estática con ISR. `settings` tiene lectura pública.
 */
export async function getTeam(): Promise<TeamMember[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", TEAM_SETTINGS_KEY)
      .maybeSingle();
    if (!data?.value) return DEFAULT_TEAM;
    const parsed = teamListSchema.safeParse(JSON.parse(data.value));
    return parsed.success ? parsed.data : DEFAULT_TEAM;
  } catch {
    return DEFAULT_TEAM;
  }
}
