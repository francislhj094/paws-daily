import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Plus } from 'lucide-react-native';
import { useCareDaily, useTodayTasks } from '@/providers/CareDailyProvider';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CareTask, TimeSlot, TaskType } from '@/types';

const TASK_TYPE_EMOJI: Record<TaskType, string> = {
  medication: '💊',
  feeding: '🍖',
  grooming: '✂️',
  exercise: '🏃',
  other: '⭐',
};

const TIME_SLOT_COLORS: Record<TimeSlot, string> = {
  Morning: '#F59E0B',
  Noon: '#3B82F6',
  Evening: '#8B5CF6',
  Bedtime: '#6366F1',
};

export default function TodaysCareScreen() {
  const insets = useSafeAreaInsets();
  const { markTaskComplete, isMarkingComplete, pets } = useCareDaily();
  const todayTasks = useTodayTasks();

  const handleMarkComplete = async (taskId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await markTaskComplete(taskId);
  };

  const incompleteTasks = todayTasks.filter(t => !t.isCompleted);
  const completedTasks = todayTasks.filter(t => t.isCompleted);

  const tasksByPet = incompleteTasks.reduce((acc, task) => {
    const petId = task.petId;
    if (!acc[petId]) {
      acc[petId] = [];
    }
    acc[petId].push(task);
    return acc;
  }, {} as Record<string, typeof todayTasks>);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.headerTitle}>Today&apos;s Care</Text>
          <Text style={styles.headerDate}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🐾</Text>
            <Text style={styles.emptyTitle}>No pets yet</Text>
            <Text style={styles.emptyText}>Add your first pet to start tracking their daily care</Text>
          </View>
        ) : incompleteTasks.length === 0 && completedTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No tasks yet</Text>
            <Text style={styles.emptyText}>Tap the + button below to add your first care task</Text>
          </View>
        ) : incompleteTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>All done for today!</Text>
            <Text style={styles.emptyText}>Great job taking care of your pets 🐾</Text>
          </View>
        ) : (
          <>
            {Object.keys(tasksByPet).map(petId => {
              const petTasks = tasksByPet[petId];
              const pet = pets.find(p => p.id === petId);
              
              if (!pet) return null;

              return (
                <View key={petId} style={styles.petSection}>
                  <View style={styles.petHeader}>
                    {pet.photoUri ? (
                      <Image
                        source={{ uri: pet.photoUri }}
                        style={styles.petPhoto}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.petPhotoPlaceholder}>
                        <Text style={styles.petPhotoPlaceholderText}>
                          {pet.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.petName}>{pet.name}</Text>
                  </View>

                  {petTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onMarkComplete={handleMarkComplete}
                      isMarking={isMarkingComplete}
                    />
                  ))}
                </View>
              );
            })}

            {completedTasks.length > 0 && (
              <View style={styles.completedSection}>
                <Text style={styles.completedTitle}>Completed</Text>
                {completedTasks.map(task => (
                  <View key={task.id} style={styles.completedTaskCard}>
                    <Text style={styles.completedTaskEmoji}>
                      {TASK_TYPE_EMOJI[task.taskType]}
                    </Text>
                    <View style={styles.completedTaskInfo}>
                      <Text style={styles.completedTaskName}>{task.taskName}</Text>
                      <Text style={styles.completedTaskPet}>{task.petName}</Text>
                    </View>
                    <CheckCircle2 size={28} color="#34C759" fill="#34C759" />
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => router.push('/add-task')}
      >
        <Plus size={32} color="#FFFFFF" strokeWidth={3} />
      </TouchableOpacity>
    </View>
  );
}

interface TaskCardProps {
  task: CareTask & { petName: string; petPhoto?: string };
  onMarkComplete: (id: string) => Promise<void>;
  isMarking: boolean;
}

function TaskCard({ task, onMarkComplete, isMarking }: TaskCardProps) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskContent}>
        <Text style={styles.taskEmoji}>{TASK_TYPE_EMOJI[task.taskType]}</Text>
        
        <View style={styles.taskInfo}>
          <Text style={styles.taskName}>{task.taskName}</Text>
          <View style={[styles.timeSlotBadge, { backgroundColor: TIME_SLOT_COLORS[task.timeSlot] }]}>
            <Text style={styles.timeSlotText}>{task.timeSlot}</Text>
          </View>
          {task.details && (
            <Text style={styles.taskDetails} numberOfLines={1}>{task.details}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => onMarkComplete(task.id)}
          disabled={isMarking}
        >
          {isMarking ? (
            <ActivityIndicator size="large" color="#34C759" />
          ) : (
            <View style={styles.checkCircle}>
              <View style={styles.checkCircleInner} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerDate: {
    fontSize: 17,
    color: '#6B7280',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  petSection: {
    marginBottom: 32,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  petPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  petPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPhotoPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  petName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  taskEmoji: {
    fontSize: 32,
  },
  taskInfo: {
    flex: 1,
    gap: 6,
  },
  taskName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  timeSlotBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskDetails: {
    fontSize: 15,
    color: '#6B7280',
  },
  checkButton: {
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  checkCircleInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  completedSection: {
    marginTop: 16,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  completedTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
    opacity: 0.6,
  },
  completedTaskEmoji: {
    fontSize: 24,
  },
  completedTaskInfo: {
    flex: 1,
  },
  completedTaskName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  completedTaskPet: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
