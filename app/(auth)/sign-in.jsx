// app/(auth)/sign-in.jsx
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
import { signInWithEmail } from '../../lib/appwrite';

const SignIn = () => {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async () => {
    if (isSubmitting) return;

    if (!form.email || !form.password) {
      Alert.alert(
        'Missing information',
        'Please fill in email and password.'
      );
      return;
    }

    setIsSubmitting(true);
    setFeedback('');
    console.log('Submitting sign in form', form);

    try {
      const result = await signInWithEmail({
        email: form.email.trim(),
        password: form.password,
      });

      console.log('Supabase signIn result:', result);

      setFeedback('Signed in. Welcome back to JM Labs!');
      Alert.alert('Signed in', 'Welcome back to JM Labs!', [
        {
          text: 'OK',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error) {
      console.error('Sign in failed', error);
      const msg =
        error?.message ?? 'Unexpected error while signing in.';
      setFeedback(msg);
      Alert.alert('Sign in failed', msg);
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
                onChangeText={(value) =>
                  handleChange('password', value)
                }
                secureTextEntry
                isPassword
              />
            </View>

            {feedback !== '' && (
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 14,
                  textAlign: 'center',
                  color: feedback.startsWith('Signed in')
                    ? '#16a34a'
                    : '#dc2626',
                }}
              >
                {feedback}
              </Text>
            )}

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
