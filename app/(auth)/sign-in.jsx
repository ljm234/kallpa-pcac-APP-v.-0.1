// app/(auth)/sign-in.jsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

function SignIn() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.text}>
          This is the Sign In screen. You will connect the real form later.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    color: "#444444",
  },
});
