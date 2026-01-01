import { CareTask, TimeSlot } from '@/types';

export async function scheduleTaskNotification(
  taskId: string,
  taskName: string,
  petName: string,
  timeSlot: TimeSlot
): Promise<string | null> {
  console.log(`[Notifications disabled] Would schedule: ${taskName} for ${petName} at ${timeSlot}`);
  return null;
}

export async function cancelNotification(notificationId: string): Promise<void> {
  console.log(`[Notifications disabled] Would cancel notification: ${notificationId}`);
}

export async function scheduleTaskNotifications(
  tasks: CareTask[],
  pets: { id: string; name: string }[]
): Promise<void> {
  console.log(`[Notifications disabled] Would schedule ${tasks.length} task notifications for ${pets.length} pets`);
}
