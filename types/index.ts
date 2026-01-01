export type TimeSlot = 'Morning' | 'Noon' | 'Evening' | 'Bedtime';
export type TaskType = 'medication' | 'feeding' | 'grooming' | 'exercise' | 'other';

export interface CareTask {
  id: string;
  petId: string;
  taskName: string;
  taskType: TaskType;
  timeSlot: TimeSlot;
  details?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdDate: string;
}

export interface Pet {
  id: string;
  name: string;
  photoUri?: string;
}
