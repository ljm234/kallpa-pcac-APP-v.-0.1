// components/SearchInput.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@search_history';
const MAX_HISTORY = 2; // Only last 2 searches

const SearchInput = ({ value, onChangeText, onSubmit }) => {
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Load search history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (!stored) {
        setHistory([]);
        return [];
      }
      const parsed = JSON.parse(stored);
      setHistory(Array.isArray(parsed) ? parsed : []);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.log('Error loading search history:', e);
      setHistory([]);
      return [];
    }
  };

  const saveToHistory = async (query) => {
    try {
      const trimmed = query.trim();
      if (!trimmed) return;

      // Remove duplicates and add to front, keep only last 2
      const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
      setHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      console.log('SAVED TO HISTORY:', newHistory);
    } catch (e) {
      console.log('Error saving search history:', e);
    }
  };

  const handleSubmit = async () => {
    const q = String(value || '').trim();
    if (!q) {
      router.push('/home');
      setShowDropdown(false);
      return;
    }

    // Always save to history first
    await saveToHistory(q);

    // Call parent onSubmit AFTER saving (if provided)
    if (typeof onSubmit === 'function') {
      try {
        onSubmit(q);
      } catch (e) {
        console.log('Parent onSubmit threw error:', e);
      }
    } else {
      // Default navigation behavior
      router.push(`/search/${encodeURIComponent(q)}`);
    }

    setShowDropdown(false);
  };

  const handleHistorySelect = async (item) => {
    onChangeText(item);
    setShowDropdown(false);
    // Update history to move this item to the top
    await saveToHistory(item);
    router.push(`/search/${encodeURIComponent(item)}`);
  };

  const handleFocus = async (e) => {
    // For web: capture position so dropdown can align
    if (Platform.OS === 'web' && e?.target) {
      const rect = e.target.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    // Refresh history before showing dropdown to ensure latest after Enter
    await loadHistory();
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Delay hiding dropdown so tap on items works
    setTimeout(() => setShowDropdown(false), 200);
  };

  const handleChangeText = (text) => {
    onChangeText(text);
  };

  const handleKeyPress = (e) => {
    // Only autocomplete with TAB if the search box is empty or user hasn't typed anything different
    if (e.nativeEvent.key === 'Tab' && history.length > 0 && showDropdown && !value) {
      e.preventDefault();
      const firstSuggestion = history[0];
      onChangeText(firstSuggestion);
      setShowDropdown(false);
    }
  };

  return (
    <>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          <TextInput
            style={styles.input}
            placeholder="Search for a video topic..."
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={handleChangeText}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={handleSubmit} style={styles.iconWrapper}>
            <Text style={styles.iconText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown rendered at document root level for web */}
      {showDropdown && Platform.OS === 'web' && (
        <div
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top + 5}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            backgroundColor: '#1C1C1E',
            borderRadius: '16px',
            border: '1px solid #2C2C2E',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 999999999,
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}
        >
          {history.length === 0 && (
            <div style={{ padding: '14px 20px', color: '#6B7280', fontSize: 14 }}>
              Type a search and press Enter to add it here.
            </div>
          )}
          {history.map((item, index) => (
            <div
              key={index}
              onClick={() => handleHistorySelect(item)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 20px',
                borderBottom: index === history.length - 1 ? 'none' : '1px solid #2C2C2E',
                cursor: 'pointer',
                backgroundColor: 'transparent',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2C2C2E'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ 
                color: '#E5E5E7', 
                fontSize: '15px',
                fontWeight: '500',
                letterSpacing: '0.3px'
              }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Native dropdown for mobile */}
      {showDropdown && Platform.OS !== 'web' && (
        <View style={styles.dropdown}>
          {history.length === 0 && (
            <View style={styles.dropdownItem}>
              <Text style={[styles.dropdownText,{color:'#9CA3AF'}]}>Type a search and press Enter…</Text>
            </View>
          )}
          {history.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownItem,
                index === history.length - 1 && styles.dropdownItemLast
              ]}
              onPress={() => handleHistorySelect(item)}
            >
              <Text style={styles.dropdownText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </>
  );
};

export default SearchInput;

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginTop: 16,
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  dropdown: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#1f2937',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF9C01',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 8px 28px rgba(0,0,0,0.55)' }
      : {
          shadowColor: '#FF9C01',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 12,
        }),
    zIndex: 99999,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  dropdownText: {
    color: '#F9FAFB',
    fontSize: 15,
    flex: 1,
  },
});
