import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { usePetMeds } from '@/providers/PetMedsProvider';
import { Medication, ScheduleType } from '@/types';
import { Edit2, Trash2, Save, X, Calendar, Package, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const SCHEDULES: ScheduleType[] = ['Daily', 'Weekly', 'Monthly', 'Every 3 Months', 'Every 6 Months', 'Yearly'];

export default function MedicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, pets, updateMedication, deleteMedication } = usePetMeds();
  
  const medication = medications.find(m => m.id === id);
  const pet = medication ? pets.find(p => p.id === medication.petId) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editedMed, setEditedMed] = useState<Medication | null>(null);

  if (!medication || !pet) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Medication Details', headerShown: true }} />
        <View style={styles.errorState}>
          <AlertCircle size={64} color="#DC2626" />
          <Text style={styles.errorTitle}>Medication Not Found</Text>
          <Text style={styles.errorText}>This medication may have been deleted.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleEdit = () => {
    setEditedMed({ ...medication });
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMed(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveEdit = async () => {
    if (!editedMed) return;

    if (!editedMed.name.trim() || !editedMed.dosage.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      await updateMedication(editedMed);
      setIsEditing(false);
      setEditedMed(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Medication updated successfully.');
    } catch (error) {
      console.error('Error updating medication:', error);
      Alert.alert('Error', 'Failed to update medication. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medication.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMedication(medication.id);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('Error', 'Failed to delete medication. Please try again.');
            }
          },
        },
      ]
    );
  };

  const currentData = isEditing && editedMed ? editedMed : medication;
  const remainingPercentage = currentData.totalQuantity && currentData.remainingQuantity
    ? (currentData.remainingQuantity / currentData.totalQuantity) * 100
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen 
        options={{ 
          title: isEditing ? 'Edit Medication' : 'Medication Details',
          headerShown: true,
          headerRight: () => (
            isEditing ? (
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={handleCancelEdit} style={styles.headerButton}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit} style={styles.headerButton}>
                  <Save size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.headerButtons}>
                <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                  <Edit2 size={24} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                  <Trash2 size={24} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )
          ),
        }} 
      />

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E8E']}
          style={styles.header}
        >
          <Text style={styles.headerPetName}>{pet.name}</Text>
          <Text style={styles.headerMedName}>{currentData.name}</Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dosage</Text>
            {isEditing && editedMed ? (
              <TextInput
                style={styles.editInput}
                value={editedMed.dosage}
                onChangeText={(text) => setEditedMed({ ...editedMed, dosage: text })}
                placeholder="Enter dosage"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.infoValue}>{currentData.dosage}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Frequency</Text>
            {isEditing && editedMed ? (
              <View style={styles.scheduleButtons}>
                {SCHEDULES.map((schedule) => (
                  <TouchableOpacity
                    key={schedule}
                    style={[
                      styles.scheduleButton,
                      editedMed.schedule === schedule && styles.scheduleButtonActive
                    ]}
                    onPress={() => setEditedMed({ ...editedMed, schedule })}
                  >
                    <Text style={[
                      styles.scheduleButtonText,
                      editedMed.schedule === schedule && styles.scheduleButtonTextActive
                    ]}>
                      {schedule}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.infoValue}>{currentData.schedule}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Next Due Date</Text>
            <View style={styles.dateContainer}>
              <Calendar size={16} color="#FF6B6B" />
              <Text style={styles.infoValueDate}>{new Date(currentData.nextDue).toLocaleDateString()}</Text>
            </View>
          </View>

          {currentData.lastGiven && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Last Given</Text>
              <Text style={styles.infoValue}>{new Date(currentData.lastGiven).toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Treatment Period</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Start Date</Text>
            {isEditing && editedMed ? (
              <TextInput
                style={styles.editInput}
                value={editedMed.startDate || ''}
                onChangeText={(text) => setEditedMed({ ...editedMed, startDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.infoValue}>
                {currentData.startDate ? new Date(currentData.startDate).toLocaleDateString() : 'Not set'}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>End Date</Text>
            {isEditing && editedMed ? (
              <TextInput
                style={styles.editInput}
                value={editedMed.endDate || ''}
                onChangeText={(text) => setEditedMed({ ...editedMed, endDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            ) : (
              <Text style={styles.infoValue}>
                {currentData.endDate ? new Date(currentData.endDate).toLocaleDateString() : 'Ongoing'}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package size={20} color="#FF6B6B" />
            <Text style={styles.sectionTitle}>Inventory</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Remaining Quantity</Text>
            {isEditing && editedMed ? (
              <TextInput
                style={styles.editInputSmall}
                value={editedMed.remainingQuantity?.toString() || ''}
                onChangeText={(text) => setEditedMed({ ...editedMed, remainingQuantity: parseInt(text) || 0 })}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{currentData.remainingQuantity || 'Not tracked'}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Quantity</Text>
            {isEditing && editedMed ? (
              <TextInput
                style={styles.editInputSmall}
                value={editedMed.totalQuantity?.toString() || ''}
                onChangeText={(text) => setEditedMed({ ...editedMed, totalQuantity: parseInt(text) || 0 })}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
              />
            ) : (
              <Text style={styles.infoValue}>{currentData.totalQuantity || 'Not tracked'}</Text>
            )}
          </View>

          {remainingPercentage !== null && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${remainingPercentage}%`,
                      backgroundColor: remainingPercentage < 20 ? '#DC2626' : remainingPercentage < 40 ? '#F59E0B' : '#10B981'
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{remainingPercentage.toFixed(0)}% remaining</Text>
            </View>
          )}

          {currentData.refillReminderThreshold && currentData.remainingQuantity !== undefined && 
           currentData.remainingQuantity <= currentData.refillReminderThreshold && (
            <View style={styles.refillAlert}>
              <AlertCircle size={20} color="#F59E0B" />
              <Text style={styles.refillAlertText}>Time to refill soon!</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          {isEditing && editedMed ? (
            <TextInput
              style={styles.notesInput}
              value={editedMed.notes || ''}
              onChangeText={(text) => setEditedMed({ ...editedMed, notes: text })}
              placeholder="Add any additional notes about this medication..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.notesText}>
              {currentData.notes || 'No notes added yet.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  headerPetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 4,
  },
  headerMedName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: -8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  infoRow: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
  },
  infoValueDate: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  editInputSmall: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    width: 100,
  },
  scheduleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scheduleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scheduleButtonActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FF6B6B',
  },
  scheduleButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  scheduleButtonTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  refillAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  refillAlertText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  notesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  notesText: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
