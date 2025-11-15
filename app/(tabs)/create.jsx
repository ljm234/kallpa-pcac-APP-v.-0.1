// app/(tabs)/create.jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";

function Create() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Create</Text>
        <Text style={styles.text}>
          This is the Create screen. Users will be able to add videos here later.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default Create;

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
