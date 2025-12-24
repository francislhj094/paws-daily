import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function scheduleMedicationNotification(
  medicationId: string,
  medicationName: string,
  petName: string,
  nextDueDate: string,
  reminderTime: string = '08:00'
): Promise<string | null> {
  if (Platform.OS === 'web') {
    console.log('Notifications not supported on web');
    return null;
  }

  try {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const dueDate = new Date(nextDueDate);
    dueDate.setHours(hours, minutes, 0, 0);

    if (dueDate.getTime() <= Date.now()) {
      console.log('Scheduled time is in the past, skipping notification');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time for ${petName}'s medication`,
        body: `${medicationName} is due today`,
        data: { medicationId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: dueDate,
      },
    });

    console.log(`Scheduled notification ${notificationId} for ${medicationName}`);
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

export async function scheduleAllMedicationNotifications(
  medications: {
    id: string;
    petId: string;
    name: string;
    nextDue: string;
  }[],
  pets: {
    id: string;
    name: string;
  }[]
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const med of medications) {
      const pet = pets.find(p => p.id === med.petId);
      if (pet) {
        await scheduleMedicationNotification(
          med.id,
          med.name,
          pet.name,
          med.nextDue
        );
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}
