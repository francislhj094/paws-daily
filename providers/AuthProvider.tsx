import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';

const AUTH_KEY = 'auth_user';
const USERS_KEY = 'registered_users';

interface User {
  email: string;
}

interface StoredUser {
  email: string;
  password: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const getStoredUsers = async (): Promise<StoredUser[]> => {
  const stored = await AsyncStorage.getItem(USERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveStoredUsers = async (users: StoredUser[]): Promise<void> => {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
};

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

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const users = await getStoredUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error('No account found with this email address');
      }

      if (user.password !== password) {
        throw new Error('Incorrect password');
      }

      const authUser: User = { email: user.email };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      return authUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.replace('/(tabs)' as any);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const users = await getStoredUsers();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      const newUser: StoredUser = { email, password };
      users.push(newUser);
      await saveStoredUsers(users);

      const authUser: User = { email };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      return authUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.replace('/(tabs)' as any);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(AUTH_KEY);
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.replace('/login' as any);
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
