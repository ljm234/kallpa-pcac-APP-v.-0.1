// components/Trending.jsx
import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import VideoCard from './VideoCard';
import { useAppwrite } from '../hooks/useAppwrite';
import { getLatestPosts } from '../lib/appwrite';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = 260;
const CARD_SPACING = 16;
const SIDE_PADDING = (SCREEN_WIDTH - CARD_WIDTH) / 2;

const Trending = ({ posts: fallbackPosts = [] }) => {
  const { data: fetchedPosts, isLoading } = useAppwrite(getLatestPosts);
  const posts =
    fetchedPosts && fetchedPosts.length > 0 ? fetchedPosts : fallbackPosts;

  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingId, setPlayingId] = useState(null);

  // Cuando cambia la lista, reseteamos al índice 0
  useEffect(() => {
    setActiveIndex(0);
  }, [posts?.length]);

  // Auto-play del card activo (el del centro)
  useEffect(() => {
    if (!posts || posts.length === 0) {
      setPlayingId(null);
      return;
    }
    const active = posts[activeIndex];
    setPlayingId(active ? active.id : null);
  }, [activeIndex, posts]);

  if ((!posts || posts.length === 0) && !isLoading) {
    return null;
  }

  const handleScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const itemSpace = CARD_WIDTH + CARD_SPACING;
    const rawIndex = Math.round(offsetX / itemSpace);
    const clamped = Math.min(
      Math.max(rawIndex, 0),
      posts.length - 1
    );
    setActiveIndex(clamped);
  };

  const handleCardPress = (next, id) => {
    // Si tocas el card, solo alterna play/pause de ese card
    setPlayingId(next ? id : null);
  };

  const renderItem = ({ item, index }) => {
    const isActive = index === activeIndex;

    return (
      <Animatable.View
        style={[
          styles.itemWrapper,
          isActive ? styles.cardActive : styles.cardInactive,
        ]}
        animation={isActive ? 'pulse' : undefined}
        iterationCount={isActive ? 'infinite' : 1}
        duration={1200}
        useNativeDriver
      >
        <VideoCard
          video={item}
          compact
          isPlaying={playingId === item.id}
          onPress={handleCardPress}
        />
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trending</Text>

      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SIDE_PADDING,
          paddingVertical: 8,
        }}
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        decelerationRate={Platform.OS === 'ios' ? 0.98 : 0.98}
        onMomentumScrollEnd={handleScrollEnd}
        ItemSeparatorComponent={() => (
          <View style={{ width: CARD_SPACING }} />
        )}
        renderItem={renderItem}
      />
    </View>
  );
};

export default Trending;

const styles = StyleSheet.create({
  container: {
    marginTop: 18,
    marginBottom: 8,
  },
  heading: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  itemWrapper: {
    width: CARD_WIDTH,
  },
  cardActive: {
    transform: [{ scale: 1.04 }],
  },
  cardInactive: {
    transform: [{ scale: 0.94 }],
  },
});
