export interface Workstation {
  id: string;
  name: string;
  description?: string;
  location?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  workstation_id: string;
  person_name: string;
  date: string; // YYYY-MM-DD
  created_at: string;
}
