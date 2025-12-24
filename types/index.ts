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
  startDate?: string;
  endDate?: string;
  remainingQuantity?: number;
  totalQuantity?: number;
  refillReminderThreshold?: number;
  notes?: string;
}

export interface Pet {
  id: string;
  name: string;
  photoUri?: string;
  species?: string;
  breed?: string;
  birthDate?: string;
  color?: string;
  weightHistory?: WeightEntry[];
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface MedicationLog {
  medicationId: string;
  givenAt: string;
  administeredBy?: string;
  notes?: string;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  reminderMinutesBefore: number;
  darkMode: boolean;
  defaultReminderTime: string;
}

export interface OnboardingStatus {
  completed: boolean;
  currentStep: number;
}
