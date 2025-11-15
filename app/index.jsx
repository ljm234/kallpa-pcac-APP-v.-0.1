// app/index.jsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Link } from "expo-router";

export default function Welcome() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.logo}>Aora</Text>
        <Text style={styles.subtitle}>Welcome to the starter app.</Text>

        <Link href="/home" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Go to Home</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e5edf5", // soft bluish background
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  logo: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0f172a", // dark slate
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563", // neutral gray
    marginBottom: 28,
  },
  button: {
    backgroundColor: "#2563eb", // blue
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
