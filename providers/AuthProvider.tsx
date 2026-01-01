import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

const AUTH_KEY = 'auth_user';

interface User {
  email: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [isReady, setIsReady] = useState(false);

  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User | null> => {
      const stored = await AsyncStorage.getItem(AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    },
  });

  useEffect(() => {
    if (!userQuery.isLoading) {
      setIsReady(true);
    }
  }, [userQuery.isLoading]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user: User = { email };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const user: User = { email };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_KEY);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  return {
    user: userQuery.data ?? null,
    isAuthenticated: !!userQuery.data,
    isReady,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
});
