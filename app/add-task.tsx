import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useCareDaily } from '@/providers/CareDailyProvider';
import { CareTask, TimeSlot, TaskType } from '@/types';
import * as Haptics from 'expo-haptics';

const TASK_PRESETS: { type: TaskType; name: string; emoji: string }[] = [
  { type: 'medication', name: 'Give medication', emoji: '💊' },
  { type: 'feeding', name: 'Feed', emoji: '🍖' },
  { type: 'grooming', name: 'Brush/Groom', emoji: '✂️' },
  { type: 'exercise', name: 'Walk', emoji: '🏃' },
  { type: 'other', name: 'Other', emoji: '⭐' },
];

const TIME_SLOTS: TimeSlot[] = ['Morning', 'Noon', 'Evening', 'Bedtime'];

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId?: string }>();
  const { addTask, pets } = useCareDaily();
  
  const [selectedPetId, setSelectedPetId] = useState<string>(petId || '');
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('medication');
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('Morning');
  const [showDetails, setShowDetails] = useState(false);
  const [details, setDetails] = useState('');

  const handlePresetSelect = (preset: typeof TASK_PRESETS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTaskType(preset.type);
    setTaskName(preset.name);
  };

  const handleSave = async () => {
    if (!taskName.trim()) {
      Alert.alert('Missing Information', 'Please enter a task name.');
      return;
    }

    if (!selectedPetId) {
      Alert.alert('Missing Information', 'Please select a pet.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newTask: CareTask = {
      id: Date.now().toString(),
      petId: selectedPetId,
      taskName: taskName.trim(),
      taskType,
      timeSlot,
      details: details.trim() || undefined,
      isCompleted: false,
      createdDate: today,
    };

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addTask(newTask);
      router.back();
    } catch (error) {
      console.error('Error adding task:', error);
      Alert.alert('Error', 'Failed to add task. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Quick Presets</Text>
        <View style={styles.presetsGrid}>
          {TASK_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.type}
              style={[
                styles.presetButton,
                taskType === preset.type && styles.presetButtonSelected,
              ]}
              onPress={() => handlePresetSelect(preset)}
            >
              <Text style={styles.presetEmoji}>{preset.emoji}</Text>
              <Text
                style={[
                  styles.presetText,
                  taskType === preset.type && styles.presetTextSelected,
                ]}
              >
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Name *</Text>
            <TextInput
              style={styles.input}
              value={taskName}
              onChangeText={setTaskName}
              placeholder="e.g., Give heartworm pill"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="sentences"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet *</Text>
            {pets.length === 0 ? (
              <Text style={styles.noPetsText}>No pets available. Add a pet first.</Text>
            ) : (
              <View style={styles.petSelector}>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petOption,
                      selectedPetId === pet.id && styles.petOptionSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPetId(pet.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.petOptionText,
                        selectedPetId === pet.id && styles.petOptionTextSelected,
                      ]}
                    >
                      {pet.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time Slot *</Text>
            <View style={styles.timeSlotSelector}>
              {TIME_SLOTS.map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[
                    styles.timeSlotButton,
                    timeSlot === slot && styles.timeSlotButtonSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeSlot(slot);
                  }}
                >
                  <Text
                    style={[
                      styles.timeSlotButtonText,
                      timeSlot === slot && styles.timeSlotButtonTextSelected,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.toggleDetailsButton}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={styles.toggleDetailsText}>
              {showDetails ? 'Hide Details' : 'Add Details (Optional)'}
            </Text>
          </TouchableOpacity>

          {showDetails && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes/Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={details}
                onChangeText={setDetails}
                placeholder="Add any additional details..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, pets.length === 0 && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={pets.length === 0}
          >
            <Text style={styles.saveButtonText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  presetButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  presetButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  presetEmoji: {
    fontSize: 32,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  presetTextSelected: {
    color: '#3B82F6',
  },
  form: {
    gap: 24,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
  },
  noPetsText: {
    fontSize: 17,
    color: '#EF4444',
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  petSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  petOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  petOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  petOptionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6B7280',
  },
  petOptionTextSelected: {
    color: '#3B82F6',
  },
  timeSlotSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlotButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  timeSlotButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  timeSlotButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6B7280',
  },
  timeSlotButtonTextSelected: {
    color: '#FFFFFF',
  },
  toggleDetailsButton: {
    paddingVertical: 12,
  },
  toggleDetailsText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#3B82F6',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    minHeight: 56,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
