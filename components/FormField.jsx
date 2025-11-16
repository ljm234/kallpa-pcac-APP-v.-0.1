// components/FormField.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const FormField = ({
  label,
  value,
  placeholder,
  onChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
  isPassword = false,
  secureTextEntry = false,
  onTogglePassword,
  error,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">
        {label}
      </Text>

      <View
        className={`flex-row items-center rounded-2xl bg-gray-100 px-4 ${
          focused ? "border-2 border-orange-500" : "border border-gray-200"
        }`}
      >
        <TextInput
          className="flex-1 py-3 text-base text-gray-900"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={onTogglePassword}
            className="pl-2 py-2"
            accessibilityRole="button"
            accessibilityLabel={
              secureTextEntry ? "Show password" : "Hide password"
            }
          >
            <Ionicons
              name={secureTextEntry ? "eye-off" : "eye"}
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text className="mt-1 text-xs text-red-500">{error}</Text>
      ) : null}
    </View>
  );
};

export default FormField;
