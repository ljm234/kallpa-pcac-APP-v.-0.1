// app/(tabs)/_layout.jsx
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

// Tab icon component with emoji icons
const TabIcon = ({ emoji, color, name, focused }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 2 }}>
      <Text
        style={{
          fontSize: 22,
          opacity: focused ? 1 : 0.6,
        }}
      >
        {emoji}
      </Text>
      <Text
        style={{
          color,
          fontSize: 10,
          fontWeight: focused ? '700' : '500',
        }}
        numberOfLines={1}
      >
        {name}
      </Text>
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF9C01',
        tabBarInactiveTintColor: '#CDCDE0',
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#161622',
          borderTopWidth: 1,
          borderTopColor: '#232533',
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="visit"
        options={{
          title: 'Visit',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              emoji="🩺"
              color={color}
              name="Visit"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              emoji="�"
              color={color}
              name="Cases"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: 'Impact',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              emoji="📈"
              color={color}
              name="Impact"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              emoji="👤"
              color={color}
              name="Profile"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
