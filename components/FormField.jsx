// components/FormField.jsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const FormField = ({
  title,
  label,
  value,
  placeholder,
  onChangeText,
  handleChangeText,
  keyboardType = "default",
  autoCapitalize = "none",
  isPassword = false,
  secureTextEntry = false,
  onTogglePassword,
  error,
  otherStyles,
  multiline = false,
}) => {
  const [focused, setFocused] = useState(false);
  
  // Support both onChangeText and handleChangeText props
  const changeHandler = handleChangeText || onChangeText;
  
  // Support both title and label props
  const fieldLabel = title || label;

  return (
    <View className="w-full mb-4" style={otherStyles}>
      {fieldLabel && (
        <Text 
          className="text-sm font-bold" 
          style={{ 
            color: '#F1F5F9',
            letterSpacing: 0.3,
            textTransform: 'uppercase',
            fontSize: 13,
            marginBottom: 12,
          }}
        >
          {fieldLabel}
        </Text>
      )}

      <View
        className={`flex-row items-center rounded-2xl px-5 ${
          focused ? "border-2" : "border-2"
        }`}
        style={{ 
          backgroundColor: '#0F172A',
          borderColor: focused ? '#FF9C01' : '#1E293B',
          ...Platform.select({
            web: {
              boxShadow: focused 
                ? "0 0 0 3px rgba(255, 156, 1, 0.1), 0 10px 15px -3px rgba(0, 0, 0, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)"
                : "0 4px 6px -1px rgba(0, 0, 0, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            },
            default: {
              shadowColor: focused ? "#FF9C01" : "#000",
              shadowOffset: { width: 0, height: focused ? 4 : 2 },
              shadowOpacity: focused ? 0.3 : 0.2,
              shadowRadius: focused ? 12 : 6,
              elevation: focused ? 8 : 4,
            },
          }),
        }}
      >
        <TextInput
          className="flex-1 text-base"
          style={{ 
            color: '#F8FAFC',
            minHeight: multiline ? 100 : 52,
            textAlignVertical: multiline ? 'top' : 'center',
            paddingVertical: multiline ? 16 : 0,
            fontSize: 16,
            fontWeight: '500',
          }}
          value={value}
          onChangeText={changeHandler}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
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
              size={22}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text className="mt-2 text-xs font-medium" style={{ color: '#EF4444' }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export default FormField;
