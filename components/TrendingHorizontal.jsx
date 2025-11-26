// components/TrendingHorizontal.jsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import VideoCard from './VideoCard';
import { getAllPosts, FALLBACK_VIDEOS } from '../lib/appwrite';

const { width } = Dimensions.get('window');

const TrendingHorizontal = ({ posts, onVideoPress, playingVideoId = null }) => {
  const flatListRef = useRef(null);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  // start with immediate synchronous fallback so UI shows videos instantly
  const [localFallback, setLocalFallback] = useState(FALLBACK_VIDEOS || []);
  const [isInteracting, setIsInteracting] = useState(false);
  // (no optimistic requestedPlayingId by default) — when a user taps play
  // we will notify the parent immediately and keep the carousel stationary
  // per user preference.

  // Make card width responsive so the centered card fills nicely on all devices
  const CARD_WIDTH = Math.min(360, Math.round(width * 0.66));
  const CARD_MARGIN = 14;
  const ITEM_WIDTH = CARD_WIDTH + CARD_MARGIN;
  // Use symmetric horizontal margin on items (marginHorizontal = CARD_MARGIN/2)
  // and subtract half the margin from the center padding so a card's center
  // aligns with the screen center. This fixes off-by-half-margin centering.
  const CENTER_PADDING = Math.max(0, Math.round((width - CARD_WIDTH) / 2 - CARD_MARGIN / 2));
  // Manual adjustment kept at 0 for default centering. Change only if a
  // device-specific tweak is required.
  const CENTER_ADJUST = 0; // px

  // helper to compute offset that centers a given index
  // Note: we set contentContainerStyle paddingHorizontal to CENTER_PADDING,
  // so the scroll offset to center item `index` is simply ITEM_WIDTH * index.
  const centerOffset = (index) => ITEM_WIDTH * index;

  // Use posts passed in or fall back to local demo videos fetched from lib/appwrite.
  // When using the local fallback, mark each video with `isFallback: true` so
  // the UI can display a visible 'Demo' badge and make it obvious videos are present.
  const usingFallback = !(posts && posts.length > 0);
  const postsToUse = usingFallback
    ? (localFallback || []).map((v) => ({ ...v, isFallback: true }))
    : posts;

  // Prepare looped data for infinite scroll: [last, ...postsToUse, first]
  const looped = React.useMemo(() => {
    if (!postsToUse || postsToUse.length <= 1) return postsToUse || [];
    return [postsToUse[postsToUse.length - 1], ...postsToUse, postsToUse[0]];
  }, [postsToUse]);

  // Initialize with first real video (index 1 in looped)
  useEffect(() => {
    if (!looped || looped.length === 0 || initialized) return;

    const firstReal = looped[1];
    setActiveVideoId(firstReal?.id ?? null);
    setInitialized(true);
    // Scroll to the first real item (index 1) and center it.
    setTimeout(() => {
      if (flatListRef.current && looped.length > 1) {
        try {
          flatListRef.current.scrollToOffset({ offset: centerOffset(1), animated: false });
        } catch (e) {
          console.log('Scroll error:', e);
        }
      }
    }, 100);
  }, [looped, initialized]);

  // Auto-scroll through videos (work on looped data) - DISABLED to prevent infinite loop
  // User can manually swipe through videos instead
  /*
  useEffect(() => {
    if (!looped || looped.length <= 1 || !initialized) return;

    const isAnyPlaying = Boolean(playingVideoId);

    const interval = setInterval(() => {
      // don't auto-advance while user is interacting (drag or hover)
      // or while a video is actively playing elsewhere
      if (isInteracting || isAnyPlaying) return;

      // Find current index in looped array
      const currentLoopIndex = looped.findIndex((p) => p.id === activeVideoId);
      // If not found, default to 1
      const safeCurrent = currentLoopIndex >= 0 ? currentLoopIndex : 1;
      let nextLoopIndex = (safeCurrent + 1) % looped.length;

      // Scroll to next loop index
      if (flatListRef.current) {
        try {
          // ensure we never land on the fake ends without adjusting
          console.log('[TrendingHorizontal][auto] safeCurrent=', safeCurrent, 'nextLoopIndex=', nextLoopIndex, 'loopedLen=', looped.length);
          if (nextLoopIndex === looped.length - 1) {
            // appended first (duplicate at end): animate directly to the real first item for smooth wrap
            const realFirstIndex = 1;
            const offReal = centerOffset(realFirstIndex);
            console.log('[TrendingHorizontal][auto] animate to real first offset=', offReal);
            flatListRef.current.scrollToOffset({ offset: offReal, animated: true });
            setActiveVideoId(looped[realFirstIndex].id);
          } else if (nextLoopIndex === 0) {
            // prepended last (duplicate at start): animate directly to the real last item for smooth wrap
            const lastRealIndex = looped.length - 2;
            const offL = centerOffset(lastRealIndex);
            console.log('[TrendingHorizontal][auto] animate to last real offset=', offL);
            flatListRef.current.scrollToOffset({ offset: offL, animated: true });
            setActiveVideoId(looped[lastRealIndex].id);
          } else {
            const offN = centerOffset(nextLoopIndex);
            console.log('[TrendingHorizontal][auto] scroll to normal offset=', offN);
            flatListRef.current.scrollToOffset({ offset: offN, animated: true });
            setActiveVideoId(looped[nextLoopIndex].id);
          }
        } catch (e) {
          console.log('Auto-scroll error:', e);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [looped, activeVideoId, initialized, isInteracting]);
  */
  

  if (!postsToUse || postsToUse.length === 0) {
    return null;
  }

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Use viewability to determine which item is centered/visible.
  const viewabilityConfig = { itemVisiblePercentThreshold: 30, minimumViewTime: 50 };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!viewableItems || viewableItems.length === 0) return;

    // Build a set of visible IDs to pause current video if it leaves view
    const visibleIds = new Set(
      viewableItems
        .map((v) => (v?.item?.id ?? v?.key))
        .filter((id) => id != null)
        .map((id) => String(id))
    );

    if (playingVideoId && !visibleIds.has(String(playingVideoId))) {
      if (onVideoPress) onVideoPress(false, playingVideoId);
    }

    const first = viewableItems[0];
    const idx = first.index;
    if (idx == null) return;

    // BONUS: Auto-pause if playing video scrolls out of view
    if (playingVideoId && looped[idx]?.id !== playingVideoId) {
      console.log('[TrendingHorizontal] Playing video scrolled away, auto-pausing');
      if (onVideoPress) {
        onVideoPress(false, playingVideoId); // notify parent to pause
      }
    }

    // handle fake edges by animating to the real item (smoother)
    if (idx <= 0) {
      const lastRealIndex = looped.length - 2;
      try {
        flatListRef.current.scrollToOffset({ offset: centerOffset(lastRealIndex), animated: false });
        setActiveVideoId(looped[lastRealIndex].id);
        if (playingVideoId && looped[lastRealIndex]?.id !== playingVideoId && onVideoPress) {
          onVideoPress(false, playingVideoId);
        }
      } catch (e) {
        console.log('viewability adjust error:', e);
      }
      return;
    }

    if (idx >= looped.length - 1) {
      try {
        flatListRef.current.scrollToOffset({ offset: centerOffset(1), animated: false });
        setActiveVideoId(looped[1].id);
        if (playingVideoId && looped[1]?.id !== playingVideoId && onVideoPress) {
          onVideoPress(false, playingVideoId);
        }
      } catch (e) {
        console.log('viewability adjust error:', e);
      }
      return;
    }

    setActiveVideoId(looped[idx].id);
    if (playingVideoId && looped[idx]?.id !== playingVideoId && onVideoPress) {
      onVideoPress(false, playingVideoId);
    }

    // No requested-playing flow — nothing to do here.
  }).current;

  

  const onMomentumScrollEnd = (event) => {
  const contentOffsetX = event.nativeEvent.contentOffset.x;
  if (!looped || looped.length === 0) return;

  // compute the index based on contentOffset (we use ITEM_WIDTH steps).
  // contentOffset already measures from the start of the padded content so
  // the index is simply contentOffsetX / ITEM_WIDTH (round to nearest).
  const computedIndex = Math.floor((contentOffsetX + ITEM_WIDTH / 2) / ITEM_WIDTH);
  let loopIndex = computedIndex;

    if (loopIndex <= 0) {
      const lastRealIndex = looped.length - 2;
      try {
        flatListRef.current.scrollToOffset({ offset: centerOffset(lastRealIndex), animated: false });
        setActiveVideoId(looped[lastRealIndex].id);
        // Auto-pause if we scrolled away from playing video
        if (playingVideoId && looped[lastRealIndex]?.id !== playingVideoId && onVideoPress) {
          onVideoPress(false, playingVideoId);
        }
      } catch (e) {
        console.log('scroll adjust error:', e);
      }
      return;
    }

    if (loopIndex >= looped.length - 1) {
      try {
        flatListRef.current.scrollToOffset({ offset: centerOffset(1), animated: false });
        setActiveVideoId(looped[1].id);
        // Auto-pause if we scrolled away from playing video
        if (playingVideoId && looped[1]?.id !== playingVideoId && onVideoPress) {
          onVideoPress(false, playingVideoId);
        }
      } catch (e) {
        console.log('scroll adjust error:', e);
      }
      return;
    }

    setActiveVideoId(looped[loopIndex].id);
    
    // Auto-pause if we scrolled away from playing video
    if (playingVideoId && looped[loopIndex]?.id !== playingVideoId && onVideoPress) {
      onVideoPress(false, playingVideoId);
    }
    
    // Scrolling/momentum finished — user is no longer interacting.
    setIsInteracting(false);
  };

  // Some devices/users perform short drags that end without a long momentum
  // phase; mirror the same edge-wrap and auto-pause logic here so the
  // carousel always loops in both directions during manual swipes.
  const onScrollEndDrag = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    if (!looped || looped.length === 0) return;

    const computedIndex = Math.floor((contentOffsetX + ITEM_WIDTH / 2) / ITEM_WIDTH);
    let loopIndex = computedIndex;

    if (loopIndex <= 0) {
      const lastRealIndex = looped.length - 2;
      try {
        flatListRef.current.scrollToOffset({ offset: centerOffset(lastRealIndex), animated: false });
        setActiveVideoId(looped[lastRealIndex].id);
        if (playingVideoId && looped[lastRealIndex]?.id !== playingVideoId && onVideoPress) {
          onVideoPress(false, playingVideoId);
        }
      } catch (e) {
        // ignore
      }
      return;
    }

    if (loopIndex >= looped.length - 1) {
      try {
        flatListRef.current.scrollToOffset({ offset: centerOffset(1), animated: false });
        setActiveVideoId(looped[1].id);
        if (playingVideoId && looped[1]?.id !== playingVideoId && onVideoPress) {
          onVideoPress(false, playingVideoId);
        }
      } catch (e) {
        // ignore
      }
      return;
    }

    // normal case: update active id and ensure auto-pause if needed
    setActiveVideoId(looped[loopIndex].id);
    if (playingVideoId && looped[loopIndex]?.id !== playingVideoId && onVideoPress) {
      onVideoPress(false, playingVideoId);
    }

    setIsInteracting(false);
  };

  const handleVideoPress = (isPlaying, videoId) => {
    setActiveVideoId(videoId);

    // Per user request: do NOT scroll the carousel when tapping play — keep
    // the card where it is. Notify the parent immediately about playback
    // changes so the global playing state updates and the UI reflects it.
    if (onVideoPress) {
      onVideoPress(isPlaying, videoId);
    }
  };

  const renderTrendingItem = ({ item, index }) => {
    // `isActive` represents which item is centered/active in the carousel.
    const isActive = activeVideoId === item.id;
    // `isPlaying` comes only from the authoritative `playingVideoId`
    // passed from the parent (Home). No optimistic local flag used here.
    const isPlaying = Boolean(playingVideoId === item.id);
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const interpScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1.1, 0.9],
    });

    const interpOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
    });

    return (
      <Animated.View
        style={[
          {
            width: CARD_WIDTH,
            marginHorizontal: CARD_MARGIN / 2,
            transform: [{ scale: interpScale }],
            opacity: interpOpacity,
          },
        ]}
      >
        <VideoCard
          video={item}
          compact={true}
          isPlaying={isPlaying}
          onPress={handleVideoPress}
          // pass interaction state so the card can ignore taps during swipes
          isInteracting={isInteracting}
        />
      </Animated.View>
    );
  };

  // Do not hide the whole Trending UI while the user is touching — that produced
  // a blink/flash that hid UI until touch release. Instead we keep Trending visible
  // and prevent accidental toggles by letting cards ignore taps while interacting.
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trending</Text>
  {/* center guide removed (debug) */}

      <FlatList
        ref={flatListRef}
        data={looped}
        keyExtractor={(item, index) => String(item.id) + '-' + index}
        renderItem={renderTrendingItem}
        horizontal
        showsHorizontalScrollIndicator={false}
  snapToInterval={ITEM_WIDTH}
  // Use 'start' alignment together with paddingHorizontal = (width - ITEM_WIDTH)/2
  // so that the snap position aligns the item into the screen center. Using
  // 'center' here can double-count centering and produce a visible left-shift.
  snapToAlignment="start"
        decelerationRate={0.9}
        scrollEventThrottle={16}
        onScroll={handleScroll}
  onMomentumScrollEnd={onMomentumScrollEnd}
  onScrollEndDrag={onScrollEndDrag}
  contentContainerStyle={[styles.listContent, { paddingHorizontal: CENTER_PADDING }]}
        onLayout={() => {
          // Ensure we are scrolled to the active item after layout to avoid
          // initial race conditions where scrollToOffset runs before layout.
          try {
            if (flatListRef.current && looped && looped.length > 1) {
              const idx = Math.max(1, looped.findIndex((p) => p.id === activeVideoId));
              const safeIdx = idx >= 0 ? idx : 1;
              flatListRef.current.scrollToOffset({ offset: centerOffset(safeIdx), animated: false });
            }
          } catch (e) {
            // ignore
          }
        }}
  // Allow scrolling even when video is playing - auto-pause will handle it
  scrollEnabled={true}
        pagingEnabled={false}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
          onScrollBeginDrag={() => {
            setIsInteracting(true);
            if (playingVideoId && onVideoPress) {
              // Pause immediately on swipe so user isn't blocked by playback
              onVideoPress(false, playingVideoId);
            }
          }}
          // Keep `isInteracting` true for the whole scroll/momentum lifecycle.
          // Do NOT set `isInteracting` on touch start — that caused single taps
          // to be treated as interactions and made buttons ignore taps.
          // We clear the interacting flag when momentum ends below.
          // web mouse hover to pause auto-scroll (no-op on native)
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
      />
    </View>
  );
};

export default TrendingHorizontal;

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
    marginLeft: 20,
  },
  listContent: {
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  // centerGuide removed
  trendingItemContainer: {
    width: 220,
    marginRight: 14,
  },
});
