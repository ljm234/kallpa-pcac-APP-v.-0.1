// app/(auth)/sign-up.jsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Alert,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';

import FormField from '../../components/FormField';
import CustomButton from '../../components/CustomButton';
import { signUpWithEmail } from '../../lib/appwrite';

const SignUp = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(''); // inline confirmation text

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    if (!form.username || !form.email || !form.password) {
      Alert.alert(
        'Missing information',
        'Please fill in username, email, and password.'
      );
      return;
    }

    setIsSubmitting(true);
    setFeedback('');
    console.log('Submitting sign up form', form);

    try {
      const result = await signUpWithEmail({
        email: form.email.trim(),
        password: form.password,
        username: form.username.trim(),
      });

      console.log('Supabase signUp result:', result);

      // Inline message + optional alert
      setFeedback(
        'Account created. Check your email to confirm, then sign in.'
      );

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
      const msg =
        error?.message ?? 'Unexpected error while creating your account.';
      setFeedback(msg);
      Alert.alert('Sign up failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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

            {/* Inline success / error message */}
            {feedback !== '' && (
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 14,
                  textAlign: 'center',
                  color: feedback.startsWith('Account created')
                    ? '#16a34a' // green
                    : '#dc2626', // red
                }}
              >
                {feedback}
              </Text>
            )}

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
