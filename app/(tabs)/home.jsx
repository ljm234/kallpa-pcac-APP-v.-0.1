// app/(tabs)/home.jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";

function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.text}>
          This is the Home screen. You will show the main video feed here later.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default Home;

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
