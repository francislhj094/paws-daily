import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Plus, Pill, Trash2 } from 'lucide-react-native';
import { usePetMeds, usePetMedications } from '@/providers/PetMedsProvider';
import { formatDate } from '@/utils/dateHelpers';
import * as Haptics from 'expo-haptics';

export default function PetDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { pets, deletePet, deleteMedication } = usePetMeds();
  const medications = usePetMedications(id || '');

  const pet = pets.find(p => p.id === id);

  if (!pet) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Pet not found</Text>
      </View>
    );
  }

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

  return (
    <>
      <Stack.Screen
        options={{
          title: pet.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDeletePet}>
              <Trash2 size={22} color="#DC2626" />
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
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
                <View key={med.id} style={styles.medCard}>
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
                      onPress={() => handleDeleteMedication(med.id, med.name)}
                    >
                      <Trash2 size={20} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </>
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
  petHeader: {
    alignItems: 'center',
    marginBottom: 32,
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
