import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CareTask, TimeSlot } from '@/types';

const TIME_SLOT_HOURS: Record<TimeSlot, number> = {
  Morning: 8,
  Noon: 12,
  Evening: 18,
  Bedtime: 21,
};

export async function scheduleTaskNotification(
  taskId: string,
  taskName: string,
  petName: string,
  timeSlot: TimeSlot
): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const hours = TIME_SLOT_HOURS[timeSlot];
    const now = new Date();
    const notificationTime = new Date();
    notificationTime.setHours(hours, 0, 0, 0);
    
    if (notificationTime.getTime() <= now.getTime()) {
      notificationTime.setDate(notificationTime.getDate() + 1);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${petName}'s care!`,
        body: taskName,
        data: { taskId, timeSlot },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationTime,
      },
    });

    console.log(`Scheduled notification ${notificationId} for ${taskName} at ${timeSlot}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled notification ${notificationId}`);
  } catch (error) {
    console.error('Error cancelling notification:', error);
  }
}

export async function scheduleTaskNotifications(
  tasks: CareTask[],
  pets: { id: string; name: string }[]
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const scheduledTimeSlots = new Set<string>();

    for (const task of tasks) {
      const pet = pets.find(p => p.id === task.petId);
      if (pet) {
        const key = `${pet.id}-${task.timeSlot}`;
        if (!scheduledTimeSlots.has(key)) {
          await scheduleTaskNotification(
            task.id,
            task.taskName,
            pet.name,
            task.timeSlot
          );
          scheduledTimeSlots.add(key);
        }
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}
