import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePetMeds } from '@/providers/PetMedsProvider';
import { Clock, Filter, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

type FilterType = 'all' | 'today' | 'week' | 'month';
type PetFilter = 'all' | string;

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { logs, medications, pets } = usePetMeds();
  const [timeFilter, setTimeFilter] = useState<FilterType>('all');
  const [petFilter, setPetFilter] = useState<PetFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return logs
      .filter(log => {
        const medication = medications.find(m => m.id === log.medicationId);
        if (!medication) return false;

        if (petFilter !== 'all' && medication.petId !== petFilter) return false;

        const logDate = new Date(log.givenAt);
        
        switch (timeFilter) {
          case 'today':
            return logDate >= today;
          case 'week':
            return logDate >= weekAgo;
          case 'month':
            return logDate >= monthAgo;
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.givenAt).getTime() - new Date(a.givenAt).getTime());
  }, [logs, medications, timeFilter, petFilter]);

  const logsWithDetails = useMemo(() => {
    return filteredLogs.map(log => {
      const medication = medications.find(m => m.id === log.medicationId);
      const pet = medication ? pets.find(p => p.id === medication.petId) : null;
      return { log, medication, pet };
    }).filter(item => item.medication && item.pet);
  }, [filteredLogs, medications, pets]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof logsWithDetails> = {};
    
    logsWithDetails.forEach(item => {
      const date = new Date(item.log.givenAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    
    return groups;
  }, [logsWithDetails]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Medication History</Text>
            <Text style={styles.headerSubtitle}>
              {logsWithDetails.length} dose{logsWithDetails.length !== 1 ? 's' : ''} recorded
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Filter size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {(timeFilter !== 'all' || petFilter !== 'all') && (
          <View style={styles.activeFilters}>
            {timeFilter !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{timeFilter}</Text>
                <TouchableOpacity onPress={() => setTimeFilter('all')}>
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            {petFilter !== 'all' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {pets.find(p => p.id === petFilter)?.name}
                </Text>
                <TouchableOpacity onPress={() => setPetFilter('all')}>
                  <X size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {logsWithDetails.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>
              {timeFilter !== 'all' || petFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Medication doses will appear here once administered'}
            </Text>
          </View>
        ) : (
          Object.keys(groupedLogs).map(date => (
            <View key={date} style={styles.dateGroup}>
              <Text style={styles.dateHeader}>{date}</Text>
              {groupedLogs[date].map((item, index) => (
                <View key={`${item.log.medicationId}-${item.log.givenAt}-${index}`} style={styles.logCard}>
                  <View style={styles.logCardContent}>
                    {item.pet?.photoUri ? (
                      <Image
                        source={{ uri: item.pet.photoUri }}
                        style={styles.petPhoto}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.petPhotoPlaceholder}>
                        <Text style={styles.petPhotoText}>
                          {item.pet?.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.logInfo}>
                      <Text style={styles.petName}>{item.pet?.name}</Text>
                      <Text style={styles.medName}>{item.medication?.name}</Text>
                      <Text style={styles.dosage}>{item.medication?.dosage}</Text>
                      <View style={styles.timeRow}>
                        <Clock size={14} color="#9CA3AF" />
                        <Text style={styles.time}>
                          {new Date(item.log.givenAt).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </Text>
                      </View>
                      {item.log.administeredBy && (
                        <Text style={styles.administeredBy}>
                          Given by: {item.log.administeredBy}
                        </Text>
                      )}
                      {item.log.notes && (
                        <Text style={styles.notes}>{item.log.notes}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter History</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Time Period</Text>
                <View style={styles.filterOptions}>
                  {(['all', 'today', 'week', 'month'] as FilterType[]).map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.filterOption,
                        timeFilter === filter && styles.filterOptionActive
                      ]}
                      onPress={() => setTimeFilter(filter)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        timeFilter === filter && styles.filterOptionTextActive
                      ]}>
                        {filter === 'all' ? 'All Time' : filter === 'today' ? 'Today' : filter === 'week' ? 'Past Week' : 'Past Month'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Pet</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      petFilter === 'all' && styles.filterOptionActive
                    ]}
                    onPress={() => setPetFilter('all')}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      petFilter === 'all' && styles.filterOptionTextActive
                    ]}>
                      All Pets
                    </Text>
                  </TouchableOpacity>
                  {pets.map((pet) => (
                    <TouchableOpacity
                      key={pet.id}
                      style={[
                        styles.filterOption,
                        petFilter === pet.id && styles.filterOptionActive
                      ]}
                      onPress={() => setPetFilter(pet.id)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        petFilter === pet.id && styles.filterOptionTextActive
                      ]}>
                        {pet.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setTimeFilter('all');
                  setPetFilter('all');
                  setShowFilters(false);
                }}
              >
                <Text style={styles.resetButtonText}>Reset Filters</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.95,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFilters: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  logCard: {
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
  logCardContent: {
    flexDirection: 'row',
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
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petPhotoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logInfo: {
    flex: 1,
    gap: 4,
  },
  petName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  medName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  dosage: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  time: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  administeredBy: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  notes: {
    fontSize: 13,
    color: '#4B5563',
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  filterOptionActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FF6B6B',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});
