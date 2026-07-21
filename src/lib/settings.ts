import { createClient } from "@/lib/supabase/server";

export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function getCancellationWindowHours(): Promise<number> {
  const v = await getSetting("cancellation_window_hours");
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : 24;
}
