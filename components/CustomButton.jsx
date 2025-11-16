// components/CustomButton.jsx

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

export default function CustomButton({
  title,
  handlePress,
  isLoading = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      disabled={isLoading}
      style={[styles.button, isLoading && styles.buttonDisabled]}
    >
      {isLoading && (
        <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />
      )}
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "stretch",
    maxWidth: 320,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#f97316", // orange
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loader: {
    marginRight: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
