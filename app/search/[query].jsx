// app/search/[query].jsx
import React from "react";
import { SafeAreaView, View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

function Search() {
  const { query } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>Search</Text>
        <Text style={styles.text}>
          {query
            ? `Showing results for: ${query}`
            : "No search query was provided."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

export default Search;

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
