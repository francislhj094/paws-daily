import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoggingIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login({ email, password });
    } catch {
      Alert.alert('Error', 'Failed to log in. Please try again.');
    }
  };

  const handleSignUpPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signup' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.primaryBackground }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🐾</Text>
            </View>
            <Text style={styles.appTitle}>Paws Daily</Text>
            <Text style={styles.appSubtitle}>Daily Care Checklist</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                editable={!isLoggingIn}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                editable={!isLoggingIn}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isLoggingIn && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator size="small" color={Colors.textLight} />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={handleSignUpPress} disabled={isLoggingIn}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  logoText: {
    fontSize: 48,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primaryAction,
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 17,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textDark,
  },
  input: {
    height: 56,
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 17,
    color: Colors.textDark,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    height: 56,
    backgroundColor: Colors.primaryAction,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: Colors.primaryAction,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textLight,
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  signupText: {
    fontSize: 17,
    color: Colors.textSecondary,
  },
  signupLink: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primaryAction,
  },
});
