import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getPanelContext(): Promise<{
  profile: Profile;
  role: "professional" | "admin";
  professionalId: string | null;
}> {
  const { profile } = await requireRole(["professional", "admin"], "/panel");
  let professionalId: string | null = null;
  if (profile.role === "professional") {
    const supabase = await createClient();
    const { data } = await supabase
      .from("professionals")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();
    professionalId = data?.id ?? null;
  }
  return { profile, role: profile.role as "professional" | "admin", professionalId };
}
