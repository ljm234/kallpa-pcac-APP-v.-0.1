// app/(tabs)/bookmark.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Bookmark() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Bookmarks</Text>
        <Text style={styles.text}>
          This is the Bookmark screen. Saved videos will be shown here later.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default Bookmark;

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
