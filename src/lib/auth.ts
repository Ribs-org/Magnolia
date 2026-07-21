import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function getSessionProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) return null;
  return { user, profile: { ...(profile as Profile), email: user.email } };
}

export async function requireRole(roles: Role[], nextPath?: string) {
  const session = await getSessionProfile();
  if (!session) redirect(`/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`);
  if (!roles.includes(session.profile.role)) redirect("/");
  return session;
}
