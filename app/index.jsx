// app/index.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, useRouter } from 'expo-router';

import CustomButton from '../components/CustomButton';
import { useGlobalContext } from '../context/GlobalProvider';

const Index = () => {
  const router = useRouter();
  const { isAuthLoading, isLoggedIn } = useGlobalContext();

  // 1) While we check if there is a stored session
  if (isAuthLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#020617',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#e5e7eb', fontSize: 16 }}>
          Loading your workspace…
        </Text>
      </SafeAreaView>
    );
  }

  // 2) If already logged in, skip auth screens and go to home
  if (isLoggedIn) {
    return <Redirect href="/home" />;
  }

  // 3) Not logged in → show the “Continue with email” landing card
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
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
            maxWidth: 480,
            backgroundColor: '#020617',
            borderRadius: 32,
            paddingVertical: 32,
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              color: '#e5e7eb',
              textAlign: 'center',
              fontSize: 12,
              marginBottom: 8,
            }}
          >
            Welcome to JM Labs – TEST VERSION
          </Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center',
              color: '#f9fafb',
              marginBottom: 8,
            }}
          >
            Discover endless possibilities with JM
          </Text>

          <Text
            style={{
              fontSize: 14,
              textAlign: 'center',
              color: '#9ca3af',
              marginBottom: 24,
            }}
          >
            A space where code and biology meet. Capture ideas, run
            experiments, and keep your projects organized from day one.
          </Text>

          <CustomButton
            title="Continue with email"
            handlePress={() => router.push('/sign-in')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Index;
