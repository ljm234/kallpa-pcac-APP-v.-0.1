// app/_layout.jsx
import React from 'react';
import { Stack } from 'expo-router';
import { GlobalProvider } from '../context/GlobalProvider';

export default function RootLayout() {
  return (
    <GlobalProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth stack */}
        <Stack.Screen name="(auth)" />

        {/* Main app (tabs) */}
        <Stack.Screen name="(tabs)" />

        {/* Default not-found route */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </GlobalProvider>
  );
}
