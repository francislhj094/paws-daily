import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CareDailyProvider } from "@/providers/CareDailyProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isReady: authReady } = useAuth();

  useEffect(() => {
    if (!authReady) {
      console.log('Auth not ready yet');
      return;
    }

    const currentSegment = segments[0];
    const isOnAuthScreen = currentSegment === 'login' || currentSegment === 'signup';
    
    console.log('Auth check - authenticated:', isAuthenticated, 'segment:', currentSegment);

    if (!isAuthenticated && !isOnAuthScreen) {
      console.log('Not authenticated, redirecting to login');
      router.replace('/login' as any);
    } else if (isAuthenticated && isOnAuthScreen) {
      console.log('Already authenticated, redirecting to tabs');
      router.replace('/(tabs)' as any);
    }
  }, [isAuthenticated, authReady, segments, router]);

  if (!authReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />

      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="add-pet" 
        options={{ 
          presentation: "modal",
          title: "Add Pet"
        }} 
      />
      <Stack.Screen 
        name="add-task" 
        options={{ 
          presentation: "modal",
          title: "Add Care Task"
        }} 
      />

    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CareDailyProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </CareDailyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
