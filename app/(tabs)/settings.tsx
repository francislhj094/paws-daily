import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { RotateCcw, Info, ChevronRight } from 'lucide-react-native';
import { useCareDaily } from '@/providers/CareDailyProvider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { pets, tasks, resetTodayTasks } = useCareDaily();

  const handleResetTasks = () => {
    Alert.alert(
      'Reset Today\'s Tasks',
      'This will mark all of today\'s completed tasks as incomplete. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetTodayTasks();
            Alert.alert('Success', 'Today\'s tasks have been reset');
          },
        },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Paws Daily',
      'Version 2.0.0\n\nA simple daily care checklist for your pets.\n\nMade with ❤️ for pet owners.',
      [{ text: 'OK' }]
    );
  };

  const todayTasks = tasks.filter(task => {
    const today = new Date().toISOString().split('T')[0];
    return task.createdDate === today;
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Settings' }} />
      <View style={styles.container}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleResetTasks}
            >
              <View style={styles.settingLeft}>
                <RotateCcw size={22} color="#3B82F6" />
                <Text style={styles.settingLabel}>Reset Today&apos;s Tasks</Text>
              </View>
              <ChevronRight size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleAbout}
            >
              <View style={styles.settingLeft}>
                <Info size={22} color="#3B82F6" />
                <Text style={styles.settingLabel}>About & Help</Text>
              </View>
              <ChevronRight size={22} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={styles.stats}>
            <Text style={styles.statsTitle}>Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{pets.length}</Text>
                <Text style={styles.statLabel}>Pets</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{todayTasks.length}</Text>
                <Text style={styles.statLabel}>Tasks Today</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{tasks.filter(t => t.isCompleted).length}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </>
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 56,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  stats: {
    marginTop: 12,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
