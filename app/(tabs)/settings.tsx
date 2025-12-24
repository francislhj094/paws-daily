import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Moon, Download, Upload, FileText, Info, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePetMeds } from '@/providers/PetMedsProvider';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { pets, medications, logs } = usePetMeds();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleExportData = async () => {
    try {
      const exportData = {
        pets,
        medications,
        logs,
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pet-meds-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Data exported successfully!');
      } else {
        await Share.share({
          message: jsonString,
          title: 'Pet Meds Data Export',
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleBackupData = async () => {
    try {
      const backupData = {
        pets,
        medications,
        logs,
        backupDate: new Date().toISOString(),
      };

      await AsyncStorage.setItem('pet_meds_backup', JSON.stringify(backupData));
      Alert.alert('Success', 'Backup created successfully!');
    } catch (error) {
      console.error('Error creating backup:', error);
      Alert.alert('Error', 'Failed to create backup. Please try again.');
    }
  };

  const handleRestoreData = async () => {
    Alert.alert(
      'Restore Backup',
      'This will replace all current data with the backup. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              const backupString = await AsyncStorage.getItem('pet_meds_backup');
              
              if (!backupString) {
                Alert.alert('No Backup', 'No backup found to restore.');
                return;
              }

              const backupData = JSON.parse(backupString);

              await AsyncStorage.setItem('pet_meds_pets', JSON.stringify(backupData.pets));
              await AsyncStorage.setItem('pet_meds_medications', JSON.stringify(backupData.medications));
              await AsyncStorage.setItem('pet_meds_logs', JSON.stringify(backupData.logs));

              Alert.alert('Success', 'Data restored successfully! Please restart the app.');
            } catch (error) {
              console.error('Error restoring data:', error);
              Alert.alert('Error', 'Failed to restore data. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleGenerateReport = async () => {
    try {
      let reportText = 'PET MEDICATION REPORT\n';
      reportText += `Generated: ${new Date().toLocaleString()}\n\n`;
      reportText += '=' .repeat(50) + '\n\n';

      pets.forEach(pet => {
        reportText += `PET: ${pet.name}\n`;
        if (pet.species) reportText += `Species: ${pet.species}\n`;
        if (pet.breed) reportText += `Breed: ${pet.breed}\n`;
        reportText += '\nMedications:\n';

        const petMeds = medications.filter(m => m.petId === pet.id);
        petMeds.forEach(med => {
          reportText += `  - ${med.name}\n`;
          reportText += `    Dosage: ${med.dosage}\n`;
          reportText += `    Schedule: ${med.schedule}\n`;
          reportText += `    Next Due: ${new Date(med.nextDue).toLocaleDateString()}\n`;
        });

        const petLogs = logs.filter(log => {
          const med = medications.find(m => m.id === log.medicationId);
          return med && med.petId === pet.id;
        });

        reportText += `\nRecent doses (${petLogs.slice(-5).length}):\n`;
        petLogs.slice(-5).reverse().forEach(log => {
          const med = medications.find(m => m.id === log.medicationId);
          reportText += `  - ${med?.name}: ${new Date(log.givenAt).toLocaleString()}\n`;
        });

        reportText += '\n' + '=' .repeat(50) + '\n\n';
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([reportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pet-meds-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Report generated successfully!');
      } else {
        await Share.share({
          message: reportText,
          title: 'Pet Medication Report',
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <Text style={styles.headerTitle}>Settings</Text>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Bell size={20} color="#FF6B6B" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive reminders for medications
                </Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={notificationsEnabled ? '#FF6B6B' : '#9CA3AF'}
            />
          </View>

          <View style={styles.infoBox}>
            <Info size={16} color="#3B82F6" />
            <Text style={styles.infoText}>
              Notifications are sent 15 minutes before scheduled medication time
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Moon size={20} color="#FF6B6B" />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Dark Mode</Text>
                <Text style={styles.settingDescription}>
                  Coming soon
                </Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
              thumbColor={darkMode ? '#FF6B6B' : '#9CA3AF'}
              disabled
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleBackupData}>
            <Download size={20} color="#10B981" />
            <View style={styles.actionButtonText}>
              <Text style={styles.actionButtonTitle}>Create Backup</Text>
              <Text style={styles.actionButtonDescription}>
                Save your data locally
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleRestoreData}>
            <Upload size={20} color="#F59E0B" />
            <View style={styles.actionButtonText}>
              <Text style={styles.actionButtonTitle}>Restore Backup</Text>
              <Text style={styles.actionButtonDescription}>
                Restore from local backup
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleExportData}>
            <FileText size={20} color="#3B82F6" />
            <View style={styles.actionButtonText}>
              <Text style={styles.actionButtonTitle}>Export Data</Text>
              <Text style={styles.actionButtonDescription}>
                Export as JSON file
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleGenerateReport}>
            <FileText size={20} color="#8B5CF6" />
            <View style={styles.actionButtonText}>
              <Text style={styles.actionButtonTitle}>Generate Report</Text>
              <Text style={styles.actionButtonDescription}>
                Create medication summary
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.infoCard}>
            <Text style={styles.appName}>Pet Meds</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <Text style={styles.appDescription}>
              Simple medication tracking for your beloved pets
            </Text>
          </View>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pets.length}</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{medications.length}</Text>
            <Text style={styles.statLabel}>Medications</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{logs.length}</Text>
            <Text style={styles.statLabel}>Doses Given</Text>
          </View>
        </View>
      </ScrollView>
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
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  settingRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    flex: 1,
    gap: 2,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButtonDescription: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  infoCard: {
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
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  appDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
    fontSize: 32,
    fontWeight: '700',
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
