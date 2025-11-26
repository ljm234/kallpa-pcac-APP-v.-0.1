// components/CustomButton.jsx

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";

export default function CustomButton({ title, handlePress, isLoading, containerStyles }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={isLoading}
      style={[
        styles.button, 
        isLoading && styles.buttonDisabled,
        containerStyles,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color="#ffffff" size="small" />
      ) : (
        <Text style={styles.text}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: "#FF9C01",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    ...Platform.select({
      web: {
        boxShadow: "0 10px 25px -5px rgba(255, 156, 1, 0.4), 0 8px 10px -6px rgba(255, 156, 1, 0.3)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      },
      default: {
        shadowColor: "#FF9C01",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
    ...Platform.select({
      web: {
        boxShadow: "0 4px 6px -1px rgba(255, 156, 1, 0.2)",
      },
      default: {
        shadowOpacity: 0.2,
        elevation: 4,
      },
    }),
  },
  text: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontSize: 15,
  },
});
