// components/VideoCard.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const VideoCard = ({ video, compact = false, onPress }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!video) return null;

  const handlePlayPress = () => {
    setIsPlaying(!isPlaying);
    if (onPress) {
      onPress(!isPlaying, video.id);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePlayPress}
      activeOpacity={0.9}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={[styles.videoArea, compact && styles.videoAreaCompact]}>
        <View style={styles.playButton}>
          <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
        </View>
      </View>

      <Text
        style={[styles.title, compact && styles.titleCompact]}
        numberOfLines={2}
      >
        {video.title ?? 'Untitled video'}
      </Text>

      <Text
        style={[styles.meta, compact && styles.metaCompact]}
        numberOfLines={1}
      >
        {video.author ?? 'Unknown author'}
      </Text>
    </TouchableOpacity>
  );
};

export default VideoCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  cardCompact: {
    width: 220,
    marginRight: 14,
  },
  videoArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  videoAreaCompact: {
    height: 120,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 2,
    borderColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#F97316',
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
  },
  titleCompact: {
    fontSize: 14,
  },
  meta: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 3,
  },
  metaCompact: {
    fontSize: 11,
  },
});
