// app/(auth)/sign-in.jsx
import React, { useState } from "react";
import { SafeAreaView, View, Text } from "react-native";
import { Link } from "expo-router";

import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";

const SignIn = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    setTimeout(() => {
      console.log("Sign in form:", form);
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      {/* Full-screen center helper */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        {/* White card */}
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "#ffffff",
            borderRadius: 28,
            paddingVertical: 28,
            paddingHorizontal: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
                color: "#111827",
              }}
            >
              Sign in
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Use the same account you’ll use to manage your JM Labs projects.
            </Text>
          </View>

          {/* Email */}
          <FormField
            label="Email"
            placeholder="name@example.com"
            value={form.email}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, email: value }))
            }
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password */}
          <View style={{ marginTop: 16 }}>
            <FormField
              label="Password"
              placeholder="Enter your password"
              value={form.password}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, password: value }))
              }
              secureTextEntry
              isPassword
            />
          </View>

          {/* Button */}
          <CustomButton
            title={isSubmitting ? "Signing in..." : "Sign in"}
            onPress={handleSignIn}
            disabled={isSubmitting}
            style={{ marginTop: 24 }}
          />

          {/* Sign-up link */}
          <View
            style={{
              marginTop: 18,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: "#6b7280" }}>
              Don&apos;t have an account?{" "}
            </Text>
            <Link
              href="/(auth)/sign-up"
              style={{ fontSize: 14, color: "#f97316", fontWeight: "600" }}
            >
              Sign up
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignIn;
