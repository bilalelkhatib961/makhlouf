export interface ClientProfile {
  dob: string | null; // ISO date string
  weight: number | null; // kg
  height: number | null; // cm
  phone: string | null;
  nationality: string | null;
  profilePicture: string | null;
}

export interface SplitAssignment {
  id: string;
  splitId: string;
  splitName: string;
  durationWeeks: number;
  startDate: string; // ISO date string
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  joinedAt: string; // ISO date string
  profile: ClientProfile;
  currentAssignment: SplitAssignment | null;
}

export interface ClientDetail extends ClientListItem {
  history: SplitAssignment[]; // every assignment except currentAssignment, desc by startDate
}

export interface ClientProfileInput {
  dob: string | null;
  weight: number | null;
  height: number | null;
  phone: string | null;
  nationality: string | null;
  profilePicture: string | null;
}

export interface AssignSplitInput {
  clientId: string;
  splitId: string;
  startDate: string; // ISO date string
}
