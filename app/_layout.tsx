import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PetMedsProvider } from "@/providers/PetMedsProvider";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
    
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);
    };
    requestPermissions();
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
