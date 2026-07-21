export type Role = "patient" | "professional" | "admin";
export type Modality = "in_person" | "online";
export type Specialty = "psychologist" | "psychiatrist";
export type AppointmentStatus =
  | "confirmed" | "cancelled_by_patient" | "cancelled_by_center" | "completed" | "no_show";

export interface Profile { id: string; full_name: string; rut: string | null; phone: string | null; role: Role; email?: string }
export interface Professional {
  id: string; profile_id: string; slug: string; specialty: Specialty;
  photo_url: string | null; bio: string; modalities: Modality[];
  session_duration_min: number; session_price: number; meeting_url: string | null; is_active: boolean;
  profile?: Profile;
}
export interface AvailabilityRule { id: string; professional_id: string; weekday: number; start_time: string; end_time: string; modality: Modality | "both" }
export interface AvailabilityException { id: string; professional_id: string; date: string; start_time: string | null; end_time: string | null; kind: "blocked" | "extra_open"; reason: string | null }
export interface Appointment {
  id: string; patient_id: string; professional_id: string;
  starts_at: string; ends_at: string; modality: Modality; status: AppointmentStatus;
  meeting_url: string | null; source: "web" | "admin"; reminder_sent_at: string | null; created_at: string;
  patient?: Profile; professional?: Professional;
}
