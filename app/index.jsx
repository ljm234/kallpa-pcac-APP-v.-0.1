// app/index.jsx

import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

import CustomButton from "../components/CustomButton";
import appIcon from "../assets/icon.png";

export default function Onboarding() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/(auth)/sign-in");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.card}>
          {/* Logo */}
          <Image source={appIcon} style={styles.logo} resizeMode="contain" />

          {/* Textos */}
          <Text style={styles.heading}>Welcome to JM Labs - TEST VERSION</Text>

          <Text style={styles.title}>
            Discover endless possibilities with JM
          </Text>

          <Text style={styles.subtitle}>
            A space where code and biology meet. Capture ideas, run experiments,
            and keep your projects organized from day one.
          </Text>

          {/* Botón principal */}
          <View style={styles.buttonSection}>
            <CustomButton
              title="Continue with email"
              handlePress={handleContinue}
              isLoading={false}
            />
          </View>

          <Text style={styles.footer}>
            By continuing you accept the terms of use and privacy policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a", //blue
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingVertical: 30,
    alignItems: "center",
    // sombrita
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    marginBottom: 12,
  },
  heading: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  title: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#4b5563",
    textAlign: "center",
  },
  buttonSection: {
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  footer: {
    marginTop: 14,
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
  },
});
