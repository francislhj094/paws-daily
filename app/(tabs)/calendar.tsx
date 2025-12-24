import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePetMeds } from '@/providers/PetMedsProvider';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { medications, pets, logs } = usePetMeds();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const medicationsByDate = useMemo(() => {
    const dateMap: Record<string, { medication: any; pet: any; status: 'completed' | 'missed' | 'scheduled' }[]> = {};

    medications.forEach(med => {
      const pet = pets.find(p => p.id === med.petId);
      if (!pet) return;

      const nextDueDate = new Date(med.nextDue);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scheduleDate = new Date(nextDueDate);
      scheduleDate.setHours(0, 0, 0, 0);

      if (scheduleDate.getMonth() === month && scheduleDate.getFullYear() === year) {
        const dateKey = scheduleDate.toISOString().split('T')[0];
        
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = [];
        }

        const wasGiven = med.lastGiven === dateKey;
        const status = wasGiven ? 'completed' : scheduleDate < today ? 'missed' : 'scheduled';

        dateMap[dateKey].push({
          medication: med,
          pet,
          status,
        });
      }
    });

    logs.forEach(log => {
      const logDate = new Date(log.givenAt);
      if (logDate.getMonth() === month && logDate.getFullYear() === year) {
        const dateKey = logDate.toISOString().split('T')[0];
        const medication = medications.find(m => m.id === log.medicationId);
        const pet = medication ? pets.find(p => p.id === medication.petId) : null;

        if (medication && pet) {
          if (!dateMap[dateKey]) {
            dateMap[dateKey] = [];
          }

          const exists = dateMap[dateKey].some(
            item => item.medication.id === medication.id
          );

          if (!exists) {
            dateMap[dateKey].push({
              medication,
              pet,
              status: 'completed',
            });
          }
        }
      }
    });

    return dateMap;
  }, [medications, pets, logs, month, year]);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const renderCalendarDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayMedications = medicationsByDate[dateKey] || [];
      
      const hasCompleted = dayMedications.some(m => m.status === 'completed');
      const hasMissed = dayMedications.some(m => m.status === 'missed');
      const hasScheduled = dayMedications.some(m => m.status === 'scheduled');

      const isToday = new Date().toISOString().split('T')[0] === dateKey;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && styles.todayCell,
          ]}
          onPress={() => setSelectedDate(dateKey)}
        >
          <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
          {dayMedications.length > 0 && (
            <View style={styles.indicators}>
              {hasCompleted && <View style={[styles.indicator, styles.indicatorCompleted]} />}
              {hasMissed && <View style={[styles.indicator, styles.indicatorMissed]} />}
              {hasScheduled && <View style={[styles.indicator, styles.indicatorScheduled]} />}
            </View>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const selectedDateMedications = selectedDate ? medicationsByDate[selectedDate] || [] : [];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Medication Calendar</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[month]} {year}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
            <ChevronRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendar}>
          <View style={styles.weekDays}>
            {DAYS.map(day => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {renderCalendarDays()}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.indicatorCompleted]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.indicatorMissed]} />
            <Text style={styles.legendText}>Missed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.indicatorScheduled]} />
            <Text style={styles.legendText}>Scheduled</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={selectedDate !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                }) : ''}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(null)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedDateMedications.length === 0 ? (
                <View style={styles.emptyModal}>
                  <Text style={styles.emptyModalText}>No medications scheduled for this date</Text>
                </View>
              ) : (
                selectedDateMedications.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.medication.id}-${index}`}
                    style={styles.modalCard}
                    onPress={() => {
                      setSelectedDate(null);
                      router.push(`/medication/${item.medication.id}`);
                    }}
                  >
                    <View style={styles.modalCardContent}>
                      {item.pet.photoUri ? (
                        <Image
                          source={{ uri: item.pet.photoUri }}
                          style={styles.modalPetPhoto}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.modalPetPhotoPlaceholder}>
                          <Text style={styles.modalPetPhotoText}>
                            {item.pet.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.modalCardInfo}>
                        <Text style={styles.modalPetName}>{item.pet.name}</Text>
                        <Text style={styles.modalMedName}>{item.medication.name}</Text>
                        <Text style={styles.modalDosage}>{item.medication.dosage}</Text>
                      </View>
                      <View style={[
                        styles.statusBadge,
                        item.status === 'completed' && styles.statusBadgeCompleted,
                        item.status === 'missed' && styles.statusBadgeMissed,
                        item.status === 'scheduled' && styles.statusBadgeScheduled,
                      ]}>
                        <Text style={[
                          styles.statusBadgeText,
                          item.status === 'completed' && styles.statusBadgeTextCompleted,
                          item.status === 'missed' && styles.statusBadgeTextMissed,
                          item.status === 'scheduled' && styles.statusBadgeTextScheduled,
                        ]}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  calendar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#1F2937',
  },
  todayText: {
    color: '#FF6B6B',
    fontWeight: '700',
  },
  indicators: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  indicatorCompleted: {
    backgroundColor: '#10B981',
  },
  indicatorMissed: {
    backgroundColor: '#DC2626',
  },
  indicatorScheduled: {
    backgroundColor: '#3B82F6',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
  emptyModal: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalPetPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  modalPetPhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPetPhotoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCardInfo: {
    flex: 1,
    gap: 2,
  },
  modalPetName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalMedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalDosage: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeMissed: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeScheduled: {
    backgroundColor: '#DBEAFE',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeTextCompleted: {
    color: '#065F46',
  },
  statusBadgeTextMissed: {
    color: '#991B1B',
  },
  statusBadgeTextScheduled: {
    color: '#1E40AF',
  },
});
