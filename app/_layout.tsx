import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CareDailyProvider } from "@/providers/CareDailyProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isReady: authReady } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      setIsReady(true);
      
      if (!authReady) return;
      
      if (!isAuthenticated && segments[0] !== 'login' && segments[0] !== 'signup') {
        router.replace('/login' as any);
      }
    };
    
    checkAuth();
  }, [router, segments, isAuthenticated, authReady]);

  if (!isReady || !authReady) {
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
