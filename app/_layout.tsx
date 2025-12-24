import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PetMedsProvider } from "@/providers/PetMedsProvider";
import * as Notifications from 'expo-notifications';

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
    <QueryClientProvider client={queryClient}>
      <PetMedsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </PetMedsProvider>
    </QueryClientProvider>
  );
}
