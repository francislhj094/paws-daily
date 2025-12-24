export type ScheduleType = 'Daily' | 'Weekly' | 'Monthly' | 'Every 3 Months' | 'Every 6 Months' | 'Yearly';

export interface Medication {
  id: string;
  petId: string;
  name: string;
  dosage: string;
  schedule: ScheduleType;
  lastGiven?: string;
  nextDue: string;
  reminderTime?: string;
}

export interface Pet {
  id: string;
  name: string;
  photoUri?: string;
}

export interface MedicationLog {
  medicationId: string;
  givenAt: string;
}
