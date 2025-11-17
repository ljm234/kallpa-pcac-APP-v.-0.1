// components/EmptyState.jsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import CustomButton from './CustomButton';

const EmptyState = ({
  title = 'No videos found',
  subtitle = 'Be the first one to upload a video.',
}) => {
  const router = useRouter();

  const handleCreateVideo = () => {
    router.push('/(tabs)/create');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icon.png')}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>

      <CustomButton
        title="Create video"
        handlePress={handleCreateVideo}
        isLoading={false}
      />
    </View>
  );
};

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  image: {
    width: 96,
    height: 96,
    marginBottom: 16,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 18,
  },
});
