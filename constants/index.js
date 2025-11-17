// app/index.jsx
import React from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useGlobalContext } from '../context/GlobalProvider';

export default function Index() {
  const { isAuthLoading, isLoggedIn } = useGlobalContext();

  // 1) Still checking Supabase session
  if (isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#020617',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 2) Logged in → go straight to Home tabs
  if (isLoggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  // 3) Not logged in → show Sign In (which links to Sign Up)
  return <Redirect href="/(auth)/sign-in" />;
}
