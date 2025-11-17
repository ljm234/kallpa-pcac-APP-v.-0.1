// app/(tabs)/_layout.jsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

// Simple text-only tab icon used for all tabs
const SimpleTabIcon = ({ label, color, focused }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          marginBottom: 4,
          backgroundColor: focused ? color : 'transparent',
        }}
      />
      <Text
        style={{
          fontSize: 12,
          color,
          fontWeight: focused ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1f2937',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <SimpleTabIcon label="Home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookmark"
        options={{
          title: 'Bookmark',
          tabBarIcon: ({ color, focused }) => (
            <SimpleTabIcon label="Bookmark" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <SimpleTabIcon label="Create" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <SimpleTabIcon label="Profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
