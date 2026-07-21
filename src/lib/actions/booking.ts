"use server";

import type { Modality } from "@/lib/types";

/**
 * Stub for Task 11. Replace body with real appointment creation
 * (slot re-validation, insert, SLOT_TAKEN handling, email, etc.).
 * Signature must stay stable — the booking wizard (Task 10) depends on it.
 */
export async function createAppointment(input: {
  professionalId: string;
  startsAt: string;
  modality: Modality;
}): Promise<{ ok: true; appointmentId: string } | { ok: false; error: string; code?: "SLOT_TAKEN" }> {
  void input;
  return { ok: false, error: "No implementado" };
}
