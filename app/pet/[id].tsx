import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Plus, Pill, Trash2, Edit2, Save, X, TrendingUp, Calendar as CalendarIcon, Palette } from 'lucide-react-native';
import { usePetMeds, usePetMedications } from '@/providers/PetMedsProvider';
import { formatDate } from '@/utils/dateHelpers';
import * as Haptics from 'expo-haptics';
import { Pet } from '@/types';

export default function PetDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pets, deletePet, deleteMedication, updatePet } = usePetMeds();
  const medications = usePetMedications(id || '');

  const pet = pets.find(p => p.id === id);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedPet, setEditedPet] = useState<Pet | null>(null);
  const [newWeight, setNewWeight] = useState('');

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Pet not found</Text>
      </View>
    );
  }

  const handleEdit = () => {
    setEditedPet({ ...pet });
    setIsEditing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPet(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSaveEdit = async () => {
    if (!editedPet || !editedPet.name.trim()) {
      Alert.alert('Missing Information', 'Please enter pet name.');
      return;
    }

    try {
      await updatePet(editedPet);
      setIsEditing(false);
      setEditedPet(null);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error updating pet:', error);
      Alert.alert('Error', 'Failed to update pet. Please try again.');
    }
  };

  const handleAddWeight = async () => {
    if (!newWeight.trim()) {
      Alert.alert('Missing Information', 'Please enter weight.');
      return;
    }

    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue) || weightValue <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight.');
      return;
    }

    try {
      const updatedPet = {
        ...pet,
        weightHistory: [
          ...(pet.weightHistory || []),
          { date: new Date().toISOString().split('T')[0], weight: weightValue }
        ]
      };
      await updatePet(updatedPet);
      setNewWeight('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error adding weight:', error);
      Alert.alert('Error', 'Failed to add weight. Please try again.');
    }
  };

  const handleDeletePet = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet.name}? This will also delete all their medications.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await deletePet(pet.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteMedication = (medicationId: string, medicationName: string) => {
    Alert.alert(
      'Delete Medication',
      `Are you sure you want to delete ${medicationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await deleteMedication(medicationId);
          },
        },
      ]
    );
  };

  const currentData = isEditing && editedPet ? editedPet : pet;
  const weightHistory = currentData.weightHistory || [];
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : null;

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      return `${months} months`;
    } else if (months < 0) {
      return `${years - 1} years, ${12 + months} months`;
    }
    return `${years} years, ${months} months`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: pet.name,
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
                <TouchableOpacity onPress={handleDeletePet} style={styles.headerButton}>
                  <Trash2 size={22} color="#DC2626" />
                </TouchableOpacity>
              </View>
            )
          ),
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.petHeader}>
          {currentData.photoUri ? (
            <Image
              source={{ uri: currentData.photoUri }}
              style={styles.petPhoto}
              contentFit="cover"
            />
          ) : (
            <View style={styles.petPhotoPlaceholder}>
              <Text style={styles.petPhotoPlaceholderText}>
                {currentData.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isEditing && editedPet ? (
            <TextInput
              style={styles.petNameInput}
              value={editedPet.name}
              onChangeText={(text) => setEditedPet({ ...editedPet, name: text })}
              placeholder="Pet name"
              placeholderTextColor="#9CA3AF"
            />
          ) : (
            <Text style={styles.petName}>{currentData.name}</Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Species</Text>
              {isEditing && editedPet ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedPet.species || ''}
                  onChangeText={(text) => setEditedPet({ ...editedPet, species: text })}
                  placeholder="Dog, Cat..."
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.infoValue}>{currentData.species || 'Not set'}</Text>
              )}
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Breed</Text>
              {isEditing && editedPet ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedPet.breed || ''}
                  onChangeText={(text) => setEditedPet({ ...editedPet, breed: text })}
                  placeholder="Breed..."
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.infoValue}>{currentData.breed || 'Not set'}</Text>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoLabelRow}>
                <CalendarIcon size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Birth Date</Text>
              </View>
              {isEditing && editedPet ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedPet.birthDate || ''}
                  onChangeText={(text) => setEditedPet({ ...editedPet, birthDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <>
                  <Text style={styles.infoValue}>
                    {currentData.birthDate ? new Date(currentData.birthDate).toLocaleDateString() : 'Not set'}
                  </Text>
                  {currentData.birthDate && (
                    <Text style={styles.infoAge}>Age: {calculateAge(currentData.birthDate)}</Text>
                  )}
                </>
              )}
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoLabelRow}>
                <Palette size={14} color="#6B7280" />
                <Text style={styles.infoLabel}>Color</Text>
              </View>
              {isEditing && editedPet ? (
                <TextInput
                  style={styles.infoInput}
                  value={editedPet.color || ''}
                  onChangeText={(text) => setEditedPet({ ...editedPet, color: text })}
                  placeholder="Color..."
                  placeholderTextColor="#9CA3AF"
                />
              ) : (
                <Text style={styles.infoValue}>{currentData.color || 'Not set'}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.weightCard}>
          <View style={styles.weightHeader}>
            <View style={styles.weightTitleRow}>
              <TrendingUp size={20} color="#FF6B6B" />
              <Text style={styles.weightTitle}>Weight Tracking</Text>
            </View>
            {currentWeight && (
              <Text style={styles.currentWeight}>{currentWeight} kg</Text>
            )}
          </View>

          {weightHistory.length > 0 ? (
            <View style={styles.weightHistory}>
              {weightHistory.slice(-5).reverse().map((entry, index) => (
                <View key={index} style={styles.weightEntry}>
                  <Text style={styles.weightDate}>{new Date(entry.date).toLocaleDateString()}</Text>
                  <Text style={styles.weightValue}>{entry.weight} kg</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noWeightText}>No weight entries yet</Text>
          )}

          <View style={styles.addWeightSection}>
            <TextInput
              style={styles.weightInput}
              value={newWeight}
              onChangeText={setNewWeight}
              placeholder="Enter weight (kg)"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.addWeightButton} onPress={handleAddWeight}>
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Pill size={20} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Medications</Text>
            </View>
            <TouchableOpacity
              style={styles.addMedButton}
              onPress={() => router.push(`/add-medication?petId=${pet.id}`)}
            >
              <Plus size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>

          {medications.length === 0 ? (
            <View style={styles.emptyMeds}>
              <Text style={styles.emptyMedsText}>No medications yet</Text>
              <TouchableOpacity
                style={styles.addFirstMedButton}
                onPress={() => router.push(`/add-medication?petId=${pet.id}`)}
              >
                <Text style={styles.addFirstMedButtonText}>Add First Medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            medications.map(med => (
              <TouchableOpacity
                key={med.id}
                style={styles.medCard}
                onPress={() => router.push(`/medication/${med.id}`)}
              >
                <View style={styles.medCardContent}>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>{med.dosage}</Text>
                    <Text style={styles.medSchedule}>Every {med.schedule.toLowerCase()}</Text>
                    <Text style={styles.medNextDue}>
                      Next due: {formatDate(med.nextDue)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteMedButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteMedication(med.id, med.name);
                    }}
                  >
                    <Trash2 size={20} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
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
    padding: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  petHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  petPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  petPhotoPlaceholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  petName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  petNameInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    gap: 6,
  },
  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoAge: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  infoInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  weightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  currentWeight: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  weightHistory: {
    gap: 12,
    marginBottom: 16,
  },
  weightEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  weightDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  weightValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  noWeightText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
  },
  addWeightSection: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  addWeightButton: {
    backgroundColor: '#FF6B6B',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  addMedButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  medInfo: {
    flex: 1,
    gap: 4,
  },
  medName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  medDosage: {
    fontSize: 14,
    color: '#6B7280',
  },
  medSchedule: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  medNextDue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginTop: 4,
  },
  deleteMedButton: {
    padding: 8,
  },
  emptyMeds: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyMedsText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
  },
  addFirstMedButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstMedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 40,
  },
});
