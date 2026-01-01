import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronRight, Trash2 } from 'lucide-react-native';
import { useCareDaily } from '@/providers/CareDailyProvider';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function PetsScreen() {
  const insets = useSafeAreaInsets();
  const { pets, deletePet } = useCareDaily();

  const handleDeletePet = (petId: string, petName: string) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${petName}? This will also delete all their care tasks.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await deletePet(petId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.headerTitle}>My Pets</Text>
          <Text style={styles.headerSubtitle}>
            {pets.length} {pets.length === 1 ? 'pet' : 'pets'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-pet')}
        >
          <Plus size={28} color="#3B82F6" strokeWidth={2.5} />
        </TouchableOpacity>
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
            <Text style={styles.emptyText}>
              Add your first pet to start tracking their daily care
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/add-pet')}
            >
              <Text style={styles.emptyButtonText}>Add Your First Pet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pets.map(pet => (
            <View key={pet.id} style={styles.petCard}>
              <TouchableOpacity
                style={styles.petCardContent}
                onPress={() => router.push(`/add-task?petId=${pet.id}`)}
              >
                {pet.photoUri ? (
                  <Image
                    source={{ uri: pet.photoUri }}
                    style={styles.petCardPhoto}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.petCardPhotoPlaceholder}>
                    <Text style={styles.petCardPhotoPlaceholderText}>
                      {pet.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.petCardInfo}>
                  <Text style={styles.petCardName}>{pet.name}</Text>
                  <Text style={styles.petCardAction}>Tap to add task</Text>
                </View>
                <ChevronRight size={24} color="#9CA3AF" />
              </TouchableOpacity>
              
              <View style={styles.petCardActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePet(pet.id, pet.name)}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 17,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  petCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  petCardPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  petCardPhotoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCardPhotoPlaceholderText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  petCardInfo: {
    flex: 1,
    gap: 4,
  },
  petCardName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  petCardAction: {
    fontSize: 15,
    color: '#6B7280',
  },
  petCardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
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
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
