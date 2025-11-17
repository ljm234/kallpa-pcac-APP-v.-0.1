// app/(auth)/sign-in.jsx
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
import { signIn } from '../../lib/appwrite';
import { useGlobalContext } from '../../context/GlobalProvider';

const SignIn = () => {
  const router = useRouter();
  const { isAuthLoading, isLoggedIn, setUser, setIsLoggedIn } =
    useGlobalContext();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setValidationError('');
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;

    const email = form.email.trim();
    const password = form.password;

    // EMPTY-FIELDS CHECK
    if (!email || !password) {
      const msg = 'Please fill in email and password.';
      setValidationError(msg);
      Alert.alert('Missing information', msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const { user } = await signIn({ email, password });

      setUser(user);
      setIsLoggedIn(true);

      Alert.alert('Signed in', 'Welcome back to JM Labs!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/home'),
        },
      ]);
    } catch (error) {
      console.error('Sign in failed', error);
      Alert.alert(
        'Sign in failed',
        error?.message ??
          'Unexpected error while signing you in.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Sign in
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                Use the same account you’ll use to manage your JM Labs
                projects.
              </Text>
            </View>

            <FormField
              label="Email"
              title="Email"
              placeholder="name@example.com"
              value={form.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={{ marginTop: 16 }}>
              <FormField
                label="Password"
                title="Password"
                placeholder="Enter your password"
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
              title={isSubmitting ? 'Signing in…' : 'Sign in'}
              handlePress={handleSignIn}
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
                Don’t have an account?{' '}
              </Text>
              <Link
                href="/(auth)/sign-up"
                style={{
                  fontSize: 14,
                  color: '#f97316',
                  fontWeight: '600',
                }}
              >
                Sign up
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
