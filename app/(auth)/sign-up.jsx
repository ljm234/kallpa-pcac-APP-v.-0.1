// app/(auth)/sign-up.jsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Alert,
  ScrollView,
} from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';

import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { createUser } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

const SignUp = () => {
  const router = useRouter();
  const { isAuthLoading, isLoggedIn } = useGlobalContext();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // clear validation message as soon as user types
    setValidationError('');
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;

    // EMPTY FIELDS CHECK
    if (!username || !email || !password) {
      const msg = 'Please fill in username, email, and password.';
      setValidationError(msg);
      Alert.alert('Missing information', msg);
      return;
    }

    setIsSubmitting(true);

    try {
      await createUser({
        email,
        password,
        username,
      });

      Alert.alert(
        'Account created',
        'Check your email to confirm your account, then sign in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/sign-in'),
          },
        ]
      );
    } catch (error) {
      console.error('Sign up failed', error);
      Alert.alert(
        'Sign up failed',
        error?.message ??
          'Unexpected error while creating your account.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Already logged in? Skip auth screens
  if (!isAuthLoading && isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#ffffff',
              borderRadius: 28,
              paddingVertical: 28,
              paddingHorizontal: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  textAlign: 'center',
                  color: '#111827',
                }}
              >
                Sign up
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                Create your JM Labs account and start organizing your
                projects.
              </Text>
            </View>

            {/* Username */}
            <FormField
              label="Username"
              title="Username"
              placeholder="How should we call you?"
              value={form.username}
              onChangeText={(value) => handleChange('username', value)}
            />

            {/* Email */}
            <View style={{ marginTop: 16 }}>
              <FormField
                label="Email"
                title="Email"
                placeholder="name@example.com"
                value={form.email}
                onChangeText={(value) => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={{ marginTop: 16 }}>
              <FormField
                label="Password"
                title="Password"
                placeholder="Create a strong password"
                value={form.password}
                onChangeText={(value) => handleChange('password', value)}
                secureTextEntry
                isPassword
              />
            </View>

            {/* Inline validation message */}
            {validationError ? (
              <Text
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: '#dc2626',
                  textAlign: 'center',
                }}
              >
                {validationError}
              </Text>
            ) : null}

            <CustomButton
              title={isSubmitting ? 'Creating account…' : 'Sign up'}
              handlePress={handleSignUp}
              isLoading={isSubmitting}
            />

            <View
              style={{
                marginTop: 18,
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 14, color: '#6b7280' }}>
                Already have an account?{' '}
              </Text>
              <Link
                href="/(auth)/sign-in"
                style={{
                  fontSize: 14,
                  color: '#f97316',
                  fontWeight: '600',
                }}
              >
                Sign in
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignUp;
