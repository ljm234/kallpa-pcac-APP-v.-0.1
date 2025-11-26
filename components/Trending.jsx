// components/Trending.jsx (enhanced)
import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import VideoCard from './VideoCard';
import { useAppwrite } from '../hooks/useAppwrite';
import { getLatestPosts } from '../lib/appwrite';
import VideoSkeleton from './VideoSkeleton';

// Hook for responsive metrics
function useResponsiveCardMetrics() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const cardWidth = isLandscape ? Math.min(420, Math.max(320, width * 0.45)) : Math.min(420, Math.max(260, width * 0.72));
  const CARD_WIDTH = Math.round(cardWidth);
  const CARD_SPACING = 18;
  const SIDE_PADDING = Math.max(0, (width - CARD_WIDTH) / 2);
  const CARD_HEIGHT = Math.round(CARD_WIDTH * 9 / 16); // 16:9
  return { CARD_WIDTH, CARD_SPACING, SIDE_PADDING, CARD_HEIGHT };
}

const Trending = ({ posts: fallbackPosts = [] }) => {
  const { data: fetchedPosts, isLoading } = useAppwrite(getLatestPosts);
  const posts = fetchedPosts && fetchedPosts.length > 0 ? fetchedPosts : fallbackPosts;
  // Infinite carousel setup: duplicate dataset to avoid visible edges
  const LOOP_FACTOR = 5; // render 5x for extra smooth scrolling buffer
  const baseItems = posts || [];
  const loopItems = useMemo(() => {
    if (!baseItems || baseItems.length === 0) return [];
    const arr = [];
    for (let i = 0; i < LOOP_FACTOR; i += 1) {
      // Keep same ID for better React reconciliation, only add loop info for key
      arr.push(...baseItems.map((it, idx) => ({ 
        ...it, 
        __loopIndex: i,
        __arrayIndex: idx,
        __loopKey: `${it.id}-loop${i}`
      })));
    }
    return arr;
  }, [baseItems]);
  const metrics = useResponsiveCardMetrics();
  const { CARD_WIDTH, CARD_SPACING, SIDE_PADDING, CARD_HEIGHT } = metrics;

  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playingId, setPlayingId] = useState(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Preload all thumbnail images to prevent black flash
  useEffect(() => {
    if (baseItems && baseItems.length > 0) {
      baseItems.forEach((item) => {
        if (item.thumbnailUrl) {
          Image.prefetch(item.thumbnailUrl).catch(() => {
            // Silently fail if image can't be preloaded
          });
        }
      });
    }
  }, [baseItems]);

  // When posts change, center the list to the middle batch
  useEffect(() => {
    setActiveIndex(0);
    if (loopItems.length > 0) {
      const middleStart = baseItems.length * 2; // start of 3rd batch (middle of 5)
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({ index: middleStart, animated: false });
          setActiveIndex(middleStart);
        } catch (e) {
          // ignore
        }
      }, 0);
    }
  }, [posts?.length]);

  // Auto-select center for playback only after interaction (avoid autoplay policy issues on web)
  useEffect(() => {
    if (!baseItems || baseItems.length === 0 || loopItems.length === 0) { setPlayingId(null); return; }
    // Map visible index back to base item via modulo
    const baseIdx = ((activeIndex % baseItems.length) + baseItems.length) % baseItems.length;
    const active = baseItems[baseIdx];
    if (hasInteracted) setPlayingId(active ? active.id : null);
  }, [activeIndex, baseItems, loopItems, hasInteracted]);

  if ((!posts || posts.length === 0) && !isLoading) return null;

  const handleScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const space = CARD_WIDTH + CARD_SPACING;
    const rawIndex = Math.round(offsetX / space);
    const total = loopItems.length;
    if (total === 0) return;

    // If we are near the start or end batch, jump back to middle batch to keep illusion
    const batchSize = baseItems.length;
    
    let nextIndex = rawIndex;
    
    // Check if scrolling into first batch (left edge) - only jump if at index 0
    if (rawIndex === 0) {
      // Jump forward to equivalent position in third batch (middle)
      nextIndex = batchSize * 2;
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
      }, 50);
    } 
    // Check if scrolling into last batch (right edge) - only jump if at last item
    else if (rawIndex === total - 1) {
      // Jump back to equivalent position in third batch (middle)
      nextIndex = batchSize * 2;
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
      }, 50);
    }

    setActiveIndex(nextIndex);
  };

  const handleCardPress = (next, id) => {
    setHasInteracted(true);
    setPlayingId(next ? id : null);
  };

  const handleScrollBegin = () => {
    setHasInteracted(true);
  };

  const getItemLayout = (_data, index) => ({
    length: CARD_WIDTH + CARD_SPACING,
    offset: (CARD_WIDTH + CARD_SPACING) * index,
    index,
  });

  const renderItem = React.useCallback(({ item, index }) => {
    const isActive = index === activeIndex;
    const animation = isActive ? {
      0: { scale: 0.96 },
      0.5: { scale: 1.05 },
      1: { scale: 1.00 },
    } : undefined;
    return (
      <Animatable.View
        key={`${item.id}-${index}`}
        style={[
          styles.itemWrapper,
          isActive ? styles.cardActive : styles.cardInactive,
          { width: CARD_WIDTH },
        ]}
        animation={animation}
        iterationCount={isActive ? 'infinite' : 1}
        duration={2300}
        easing="ease-in-out"
        useNativeDriver
      >
        <VideoCard
          // Map looped item back to base item by id
          video={item}
          compact
          isPlaying={playingId === item.id}
          onPress={handleCardPress}
          forcedHeight={CARD_HEIGHT}
          allowFullscreen
          allowMuteToggle
          showProgress
        />
      </Animatable.View>
    );
  }, [activeIndex, playingId, CARD_WIDTH, CARD_HEIGHT, handleCardPress]);

  const skeletonCount = useMemo(() => Math.min(7, posts?.length || 7), [posts]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trending</Text>
      {isLoading && (
        <View style={{ flexDirection: 'row', paddingHorizontal: SIDE_PADDING }}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <View key={i} style={{ marginRight: i === skeletonCount - 1 ? 0 : CARD_SPACING }}>
              <VideoSkeleton width={CARD_WIDTH} height={CARD_HEIGHT} />
            </View>
          ))}
        </View>
      )}
      {!isLoading && (
        <FlatList
          ref={listRef}
            data={loopItems}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE_PADDING, paddingVertical: 8 }}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            snapToAlignment="center"
            disableIntervalMomentum
            decelerationRate={Platform.OS === 'ios' ? 0.985 : 0.985}
            onScrollBeginDrag={handleScrollBegin}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            ItemSeparatorComponent={() => <View style={{ width: CARD_SPACING }} />}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={11}
            removeClippedSubviews={false}
            updateCellsBatchingPeriod={100}
        />
      )}
    </View>
  );
};

export default Trending;

const styles = StyleSheet.create({
  container: { marginTop: 18, marginBottom: 8 },
  heading: { color: '#F9FAFB', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  itemWrapper: {},
  cardActive: {
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, transform: [{ scale: 1.02 }],
  },
  cardInactive: { opacity: 0.85, transform: [{ scale: 0.94 }] },
});
