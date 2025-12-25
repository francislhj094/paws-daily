import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PetMedsProvider } from "@/providers/PetMedsProvider";
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trpc, trpcClient } from "@/lib/trpc";

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
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const checkOnboarding = async () => {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setIsReady(true);
      
      if (!hasSeenOnboarding && segments[0] !== 'onboarding') {
        router.replace('/onboarding');
      }
    };
    
    checkOnboarding();
  }, [router, segments]);

  if (!isReady) {
    return null;
  }

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
      <Stack.Screen 
        name="history" 
        options={{ 
          title: "History"
        }} 
      />
      <Stack.Screen 
        name="scan-barcode" 
        options={{ 
          title: "Scan Barcode",
          presentation: "modal"
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
    
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Notification permission status:', status);
    };
    requestPermissions();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <PetMedsProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </PetMedsProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
