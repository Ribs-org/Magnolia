"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { specialtyLabel } from "@/components/site/professional-card";
import { createAppointment } from "@/lib/actions/booking";
import { SlotPicker, type SelectedSlot } from "@/components/booking/slot-picker";
import type { Modality, Professional, Specialty } from "@/lib/types";

export type WizardProfessional = Pick<
  Professional,
  "id" | "slug" | "specialty" | "photo_url" | "full_name" | "modalities" | "session_duration_min" | "session_price"
>;

interface WizardState {
  specialty?: Specialty;
  professionalId?: string;
  modality?: Modality;
  slot?: SelectedSlot;
}

const STORAGE_KEY = "magnolia.booking";
const STEP_LABELS = ["Especialidad", "Profesional", "Modalidad", "Fecha y hora", "Confirmar"] as const;
const SPECIALTIES: Specialty[] = ["psychologist", "psychiatrist"];

function modalityLabel(m: Modality): string {
  return m === "in_person" ? "Presencial" : "Online";
}

function computeStep(state: WizardState): number {
  if (!state.specialty) return 1;
  if (!state.professionalId) return 2;
  if (!state.modality) return 3;
  if (!state.slot) return 4;
  return 5;
}

function withAutoModality(state: WizardState, professional?: WizardProfessional): WizardState {
  if (professional && professional.modalities.length === 1) {
    return { ...state, modality: professional.modalities[0] };
  }
  return state;
}

const summaryDateFormatter = new Intl.DateTimeFormat("es-CL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Santiago",
});

function formatSlot(iso: string): string {
  const label = summaryDateFormatter.format(new Date(iso));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString("es-CL")}`;
}

function safeParseWizardState(raw: string): WizardState | null {
  try {
    return JSON.parse(raw) as WizardState;
  } catch {
    return null;
  }
}

export function BookingWizard({
  professionals,
  preselectSlug,
  isAuthenticated,
}: {
  professionals: WizardProfessional[];
  preselectSlug?: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();

  const [state, setState] = useState<WizardState>(() => {
    if (!preselectSlug) return {};
    const match = professionals.find((p) => p.slug === preselectSlug);
    if (!match) return {};
    return withAutoModality({ specialty: match.specialty, professionalId: match.id }, match);
  });
  const [step, setStep] = useState(() => computeStep(state));
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [slotRefreshKey, setSlotRefreshKey] = useState(0);

  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      sessionStorage.removeItem(STORAGE_KEY);
      const restored = safeParseWizardState(raw);
      if (restored && activeRef.current) {
        setState(restored);
        setStep(computeStep(restored));
      }
    }
    return () => {
      activeRef.current = false;
    };
  }, []);

  const professional = professionals.find((p) => p.id === state.professionalId);
  const filteredProfessionals = professionals.filter((p) => p.specialty === state.specialty);

  function selectSpecialty(specialty: Specialty) {
    const next: WizardState = { specialty };
    setState(next);
    setConfirmError(null);
    setStep(computeStep(next));
  }

  function selectProfessional(p: WizardProfessional) {
    const next = withAutoModality({ specialty: state.specialty, professionalId: p.id }, p);
    setState(next);
    setConfirmError(null);
    setStep(computeStep(next));
  }

  function selectModality(modality: Modality) {
    const next: WizardState = { ...state, modality };
    setState(next);
    setConfirmError(null);
    setStep(computeStep(next));
  }

  function selectSlot(slot: SelectedSlot) {
    const next: WizardState = { ...state, slot };
    setState(next);
    setConfirmError(null);
    setStep(computeStep(next));
  }

  function goBack() {
    setConfirmError(null);
    if (step === 4 && professional && professional.modalities.length === 1) {
      setStep(2);
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  function handleLoginRedirect() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    router.push("/login?next=/reservar");
  }

  async function handleConfirm() {
    if (!state.professionalId || !state.modality || !state.slot) return;
    setConfirming(true);
    setConfirmError(null);
    const result = await createAppointment({
      professionalId: state.professionalId,
      startsAt: state.slot.startsAt,
      modality: state.modality,
    });
    setConfirming(false);
    if (result.ok) {
      router.push(`/mi-cuenta/citas?nueva=${result.appointmentId}`);
      return;
    }
    if (result.code === "SLOT_TAKEN") {
      setConfirmError("Esa hora acaba de ser tomada. Elige otra.");
      setState((s) => ({ ...s, slot: undefined }));
      setSlotRefreshKey((k) => k + 1);
      setStep(4);
      return;
    }
    setConfirmError(result.error || "No pudimos confirmar tu reserva. Intenta nuevamente.");
  }

  return (
    <div>
      <ol className="mb-10 flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const done = n < step;
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    done
                      ? "bg-sage text-white"
                      : active
                        ? "bg-sage/15 text-sage-dark ring-2 ring-sage"
                        : "bg-white text-ink/40 ring-1 ring-ink/15"
                  }`}
                >
                  {n}
                </span>
                <span className={`hidden text-center text-xs sm:block ${active ? "text-sage-dark" : "text-ink/50"}`}>
                  {label}
                </span>
              </div>
              {n < STEP_LABELS.length && <span className="mx-2 h-px flex-1 bg-ink/10" aria-hidden />}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {SPECIALTIES.map((specialty) => (
            <button
              key={specialty}
              type="button"
              onClick={() => selectSpecialty(specialty)}
              className="rounded-xl bg-white p-8 text-left shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-sage"
            >
              <p className="font-heading text-xl text-ink">{specialtyLabel(specialty)}</p>
              <p className="mt-2 text-sm text-ink/60">
                {specialty === "psychologist"
                  ? "Acompañamiento terapéutico para tu bienestar emocional."
                  : "Evaluación y seguimiento médico especializado."}
              </p>
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div>
          {filteredProfessionals.length === 0 ? (
            <p className="rounded-xl bg-white p-6 text-center text-sm text-ink/60 shadow-sm">
              No hay profesionales disponibles por el momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredProfessionals.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProfessional(p)}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-sage"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-lilac/20">
                    {p.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-heading text-xl text-sage-dark">
                        {p.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-heading text-base text-ink">{p.full_name}</p>
                    <p className="mt-1 text-xs text-ink/60">
                      {p.session_duration_min} min · {formatPrice(p.session_price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <button type="button" onClick={goBack} className="mt-6 text-sm text-ink/60 hover:text-sage-dark">
            ‹ Volver
          </button>
        </div>
      )}

      {step === 3 && professional && (
        <div>
          <div className="flex flex-wrap gap-4">
            {professional.modalities.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectModality(m)}
                className="rounded-xl bg-white px-8 py-6 text-center shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-sage"
              >
                <p className="font-heading text-lg text-ink">{modalityLabel(m)}</p>
              </button>
            ))}
          </div>
          <button type="button" onClick={goBack} className="mt-6 text-sm text-ink/60 hover:text-sage-dark">
            ‹ Volver
          </button>
        </div>
      )}

      {step === 4 && professional && state.modality && (
        <div>
          <SlotPicker
            professionalId={professional.id}
            modality={state.modality}
            onSelect={selectSlot}
            selectedStartsAt={state.slot?.startsAt}
            refreshKey={slotRefreshKey}
          />
          <button type="button" onClick={goBack} className="mt-6 text-sm text-ink/60 hover:text-sage-dark">
            ‹ Volver
          </button>
        </div>
      )}

      {step === 5 && professional && state.modality && state.slot && (
        <div className="rounded-xl bg-white p-6 shadow-sm sm:p-8">
          <p className="font-heading text-xl text-ink">Resumen de tu reserva</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <dt className="text-ink/60">Profesional</dt>
              <dd className="font-medium text-ink">{professional.full_name}</dd>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <dt className="text-ink/60">Especialidad</dt>
              <dd className="font-medium text-ink">{specialtyLabel(professional.specialty)}</dd>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <dt className="text-ink/60">Modalidad</dt>
              <dd className="font-medium text-ink">{modalityLabel(state.modality)}</dd>
            </div>
            <div className="flex justify-between border-b border-ink/10 pb-3">
              <dt className="text-ink/60">Fecha y hora</dt>
              <dd className="font-medium text-ink">{formatSlot(state.slot.startsAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink/60">Precio</dt>
              <dd className="font-medium text-ink">{formatPrice(professional.session_price)}</dd>
            </div>
          </dl>

          {confirmError && <p className="mt-5 text-sm text-red-700">{confirmError}</p>}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className="rounded-full bg-sage px-8 py-3 text-white shadow-sm transition hover:bg-sage-dark disabled:opacity-50"
              >
                {confirming ? "Confirmando…" : "Confirmar reserva"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLoginRedirect}
                className="rounded-full bg-sage px-8 py-3 text-white shadow-sm transition hover:bg-sage-dark"
              >
                Inicia sesión para confirmar
              </button>
            )}
            <button type="button" onClick={goBack} className="text-sm text-ink/60 hover:text-sage-dark">
              ‹ Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
