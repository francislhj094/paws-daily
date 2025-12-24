import { Platform } from 'react-native';
import Constants from 'expo-constants';

function isExpoGo(): boolean {
  return Constants.executionEnvironment === 'storeClient';
}

function canUseNotifications(): boolean {
  if (Platform.OS === 'web') return false;
  if (isExpoGo() && Platform.OS === 'android') return false;
  return true;
}

export async function scheduleMedicationNotification(
  medicationId: string,
  medicationName: string,
  petName: string,
  nextDueDate: string,
  reminderTime: string = '08:00',
  reminderMinutesBefore: number = 15
): Promise<string | null> {
  if (!canUseNotifications()) {
    console.log('Notifications not supported in this environment');
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');
    
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const dueDate = new Date(nextDueDate);
    dueDate.setHours(hours, minutes, 0, 0);
    
    const notificationDate = new Date(dueDate.getTime() - reminderMinutesBefore * 60 * 1000);

    if (notificationDate.getTime() <= Date.now()) {
      console.log('Scheduled time is in the past, skipping notification');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${petName}'s medication reminder`,
        body: `${medicationName} in ${reminderMinutesBefore} minutes`,
        data: { medicationId },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notificationDate,
      },
    });

    console.log(`Scheduled notification ${notificationId} for ${medicationName} at ${notificationDate.toISOString()}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function cancelNotification(notificationId: string): Promise<void> {
  if (!canUseNotifications()) {
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
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
    reminderTime?: string;
  }[],
  pets: {
    id: string;
    name: string;
  }[],
  reminderMinutesBefore: number = 15
): Promise<void> {
  if (!canUseNotifications()) {
    console.log('Skipping notification scheduling in Expo Go');
    return;
  }

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const med of medications) {
      const pet = pets.find(p => p.id === med.petId);
      if (pet) {
        await scheduleMedicationNotification(
          med.id,
          med.name,
          pet.name,
          med.nextDue,
          med.reminderTime || '08:00',
          reminderMinutesBefore
        );
      }
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}
