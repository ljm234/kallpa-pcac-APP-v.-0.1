// app/(tabs)/_layout.jsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { icons } from "../../constants";

function TabIcon({ icon, color, name, focused }) {
  return (
    <View style={styles.iconContainer}>
      <Image
        source={icon}
        resizeMode="contain"
        style={[styles.iconImage, { tintColor: color }]}
      />
      <Text
        style={[
          styles.iconLabel,
          focused ? styles.iconLabelFocused : null,
        ]}
      >
        {name}
      </Text>
    </View>
  );
}

function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#2563eb",   // active blue
        tabBarInactiveTintColor: "#9ca3af", // gray
        tabBarStyle: {
          backgroundColor: "#020617",       // dark navy
          borderTopWidth: 1,
          borderTopColor: "#1f2937",
          height: 72,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.home}
              color={color}
              name="Home"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookmark"
        options={{
          title: "Bookmark",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.bookmark}
              color={color}
              name="Bookmark"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Create",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.plus}
              color={color}
              name="Create"
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.profile}
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

export default TabsLayout;

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 4,
    color: "#9ca3af",
  },
  iconLabelFocused: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
