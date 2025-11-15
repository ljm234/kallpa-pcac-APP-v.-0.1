// app/_layout.jsx
import React from "react";
import { Stack } from "expo-router";

function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Bottom tabs group (Home, Bookmark, Create, Profile) */}
      <Stack.Screen name="(tabs)" />

      {/* Auth group (Sign In, Sign Up) */}
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

export default RootLayout;
