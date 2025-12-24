import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PetMedsProvider } from "@/providers/PetMedsProvider";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

SplashScreen.preventAutoHideAsync();

const isExpoGo = Constants.executionEnvironment === 'storeClient';
const canUseNotifications = Platform.OS !== 'web' && !(isExpoGo && Platform.OS === 'android');

if (canUseNotifications) {
  import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }).catch(() => {
    console.log('Notifications not available');
  });
}

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-pet" 
        options={{ 
          presentation: "modal",
          title: "Add Pet"
        }} 
      />
      <Stack.Screen 
        name="add-medication" 
        options={{ 
          presentation: "modal",
          title: "Add Medication"
        }} 
      />
      <Stack.Screen 
        name="pet/[id]" 
        options={{ 
          title: "Pet Details"
        }} 
      />
      <Stack.Screen 
        name="medication/[id]" 
        options={{ 
          title: "Medication Details"
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const onboardingCompleted = await AsyncStorage.getItem('pet_meds_onboarding_completed');
        
        if (onboardingCompleted) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        router.replace('/onboarding');
      } finally {
        setIsReady(true);
        SplashScreen.hideAsync();
      }
    };

    initialize();
    
    if (canUseNotifications) {
      const requestPermissions = async () => {
        try {
          const Notifications = await import('expo-notifications');
          const { status } = await Notifications.requestPermissionsAsync();
          console.log('Notification permission status:', status);
        } catch (error) {
          console.log('Could not request notification permissions:', error);
        }
      };
      requestPermissions();
    } else {
      console.log('Notifications disabled: Running in Expo Go on Android');
    }
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PetMedsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </PetMedsProvider>
    </QueryClientProvider>
  );
}
