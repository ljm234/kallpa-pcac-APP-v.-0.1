// app/(auth)/sign-up.jsx
import React, { useState } from "react";
import { SafeAreaView, View, Text } from "react-native";
import { Link } from "expo-router";

import FormField from "../../components/FormField";
import CustomButton from "../../components/CustomButton";

const SignUp = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    setTimeout(() => {
      console.log("Sign up form:", form);
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#020617" }}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
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
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                textAlign: "center",
                color: "#111827",
              }}
            >
              Sign up
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                textAlign: "center",
                color: "#6b7280",
              }}
            >
              Create your JM Labs account and start organizing your projects.
            </Text>
          </View>

          <FormField
            label="Username"
            placeholder="How should we call you?"
            value={form.username}
            onChangeText={(value) =>
              setForm((prev) => ({ ...prev, username: value }))
            }
          />

          <View style={{ marginTop: 16 }}>
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
          </View>

          <View style={{ marginTop: 16 }}>
            <FormField
              label="Password"
              placeholder="Create a strong password"
              value={form.password}
              onChangeText={(value) =>
                setForm((prev) => ({ ...prev, password: value }))
              }
              secureTextEntry
              isPassword
            />
          </View>

          <CustomButton
            title={isSubmitting ? "Creating account..." : "Sign up"}
            onPress={handleSignUp}
            disabled={isSubmitting}
            style={{ marginTop: 24 }}
          />

          <View
            style={{
              marginTop: 18,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 14, color: "#6b7280" }}>
              Already have an account?{" "}
            </Text>
            <Link
              href="/(auth)/sign-in"
              style={{ fontSize: 14, color: "#f97316", fontWeight: "600" }}
            >
              Sign in
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;
