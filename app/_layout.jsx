import React from "react";
import { Stack } from "expo-router";

function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Main tabs layout (Home, Bookmark, Create, Profile) */}
      <Stack.Screen name="(tabs)" />

      {/* Auth layout (Sign In, Sign Up) */}
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default RootLayout;
