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
      try {
        const stored = await AsyncStorage.getItem(AUTH_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (error) {
        console.log('Error loading user from storage:', error);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!userQuery.isLoading) {
      setIsReady(true);
    }
  }, [userQuery.isLoading]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('Login attempt for:', email);

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      const users = await getStoredUsers();
      console.log('Found registered users:', users.length);
      
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error('No account found with this email address');
      }

      if (user.password !== password) {
        throw new Error('Incorrect password');
      }

      const authUser: User = { email: user.email };
      await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
      console.log('Login successful for:', email);
      return authUser;
    },
    onSuccess: (data) => {
      console.log('Login onSuccess, navigating to tabs');
      queryClient.setQueryData(['user'], data);
      router.replace('/(tabs)' as any);
    },
    onError: (error) => {
      console.log('Login error:', error.message);
    },
  });

  const signupMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('Signup attempt for:', email);

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const users = await getStoredUsers();
      console.log('Existing users count:', users.length);
      
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
      console.log('Signup successful for:', email);
      return authUser;
    },
    onSuccess: (data) => {
      console.log('Signup onSuccess, navigating to tabs');
      queryClient.setQueryData(['user'], data);
      router.replace('/(tabs)' as any);
    },
    onError: (error) => {
      console.log('Signup error:', error.message);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('Logout initiated');
      await AsyncStorage.removeItem(AUTH_KEY);
      return null;
    },
    onSuccess: () => {
      console.log('Logout successful');
      queryClient.setQueryData(['user'], null);
      router.replace('/login' as any);
    },
    onError: (error) => {
      console.log('Logout error:', error);
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      console.log('Delete account initiated');
      const currentUser = userQuery.data;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      const users = await getStoredUsers();
      const updatedUsers = users.filter(
        u => u.email.toLowerCase() !== currentUser.email.toLowerCase()
      );
      await saveStoredUsers(updatedUsers);

      await AsyncStorage.removeItem(AUTH_KEY);
      
      const petsKey = `pets_${currentUser.email}`;
      const tasksKey = `tasks_${currentUser.email}`;
      await AsyncStorage.multiRemove([petsKey, tasksKey]);
      
      console.log('Account deleted for:', currentUser.email);
      return null;
    },
    onSuccess: () => {
      console.log('Account deletion successful');
      queryClient.clear();
      router.replace('/login' as any);
    },
    onError: (error) => {
      console.log('Delete account error:', error);
    },
  });

  return {
    user: userQuery.data ?? null,
    isAuthenticated: !!userQuery.data,
    isReady,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isDeletingAccount: deleteAccountMutation.isPending,
  };
});
