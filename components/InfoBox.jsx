// components/InfoBox.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InfoBox = ({ title, subtitle, containerStyle, titleStyle, subtitleStyle }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.title, titleStyle]} numberOfLines={1}>
        {title ?? '—'}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

export default InfoBox;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
