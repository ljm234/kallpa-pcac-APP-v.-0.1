// components/SearchInput.jsx
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

const SearchInput = ({ value, onChangeText, onSubmit }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for a video topic..."
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        autoCapitalize="none"
      />
      <TouchableOpacity onPress={onSubmit} style={styles.iconWrapper}>
        {/* Simple search icon */}
        <Text style={styles.iconText}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  input: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
  },
  iconWrapper: {
    marginLeft: 8,
  },
  iconText: {
    fontSize: 18,
    color: '#9CA3AF',
  },
});
