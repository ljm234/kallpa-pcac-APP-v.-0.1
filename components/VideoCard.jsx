// components/VideoCard.jsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { Video } from 'expo-av';

const VideoCard = ({
  video,
  compact = false,
  isPlaying,
  onPress,
  isInteracting = false,
  forcedHeight,
  allowFullscreen = false,
  allowMuteToggle = false,
  showProgress = false,
}) => {
  const videoRef = useRef(null);
  const [internalPlaying, setInternalPlaying] = useState(false);
  // Track measured width of the tappable video area so zone math is accurate on web & native
  const [areaWidth, setAreaWidth] = useState(null);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  if (!video) return null;

  // If parent passes isPlaying we use that; otherwise local state
  const playing = typeof isPlaying === 'boolean' ? isPlaying : internalPlaying;

  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;

    // When we go from playing -> paused, reset to start
    if (!playing) {
      (async () => {
        try {
          if (Platform.OS === 'web') {
            // Web: use HTML5 video API
            ref.pause();
            ref.currentTime = 0;
          } else {
            // Native: use expo-av
            await ref.pauseAsync();
            await ref.setPositionAsync(0);
          }
        } catch (e) {
          console.log('Video pause/reset error:', e);
        }
      })();
    }
  }, [playing]);

  // When the parent explicitly requests play, ensure we invoke playAsync
  useEffect(() => {
    const ref = videoRef.current;
    if (!ref) return;

    if (playing) {
      (async () => {
        try {
          if (Platform.OS === 'web') {
            // Web: use HTML5 video API
            ref.play();
          } else {
            // Native: use expo-av
            await ref.playAsync();
          }
        } catch (e) {
          console.log('Video play error:', e);
        }
      })();
    }
  }, [playing]);

  const handleToggle = async () => {
    const next = !playing;

    // Local state if parent is not controlling us
    if (typeof isPlaying !== 'boolean') {
      setInternalPlaying(next);
    }

    if (onPress) {
      onPress(next, video.id);
    }
  };

  // Enhanced double-tap chain logic:
  // 1st tap in a side zone arms it (no skip yet). 2nd tap (within window) skips 10s.
  // Additional taps in same zone within chain window add +10s each.
  // Switching zones or waiting too long resets.
  const tapStateRef = useRef({ zone: null, lastTime: 0, chainActive: false });

  const SKIP_SECONDS = 0.5; // per chain increment (half a second)

  const performSkip = async (seconds) => {
    const ref = videoRef.current;
    if (!ref) return;
    try {
      if (Platform.OS === 'web') {
        const current = ref.currentTime || 0;
        const duration = ref.duration || current + Math.abs(seconds);
        ref.currentTime = Math.min(duration, Math.max(0, current + seconds));
      } else {
        const status = await ref.getStatusAsync();
        if (!status.isLoaded) return;
        const current = status.positionMillis || 0;
        const duration = status.durationMillis || current + Math.abs(seconds * 1000);
        const target = Math.min(duration, Math.max(0, current + seconds * 1000));
        await ref.setPositionAsync(target);
      }
      console.log(seconds < 0 ? `⏪ ${Math.abs(seconds)}s` : `⏩ ${seconds}s`);
    } catch (e) {
      console.log('Skip error:', e);
    }
  };

  const handleVideoTap = async (e) => {
    const width = areaWidth || 360;
    const tapX = e.nativeEvent.locationX;
    const leftEdge = width / 3;
    const rightEdge = (2 * width) / 3;
    const now = Date.now();
    const ARM_WINDOW = 400; // ms to qualify as double tap
    const CHAIN_WINDOW = 800; // ms between chain taps

    let zone;
    if (tapX < leftEdge) zone = 'left';
    else if (tapX > rightEdge) zone = 'right';
    else zone = 'center';

    const state = tapStateRef.current;

    if (zone === 'center') {
      // Reset chain and toggle play/pause
      tapStateRef.current = { zone: null, lastTime: 0, chainActive: false };
      handleToggle();
      return;
    }

    if (state.zone !== zone) {
      // New zone: arm it
      tapStateRef.current = { zone, lastTime: now, chainActive: false };
      console.log(zone === 'left' ? '⏪ arm' : '⏩ arm');
      return;
    }

    const elapsed = now - state.lastTime;
    if (!state.chainActive) {
      // Check for second tap to start chain
      if (elapsed <= ARM_WINDOW) {
        // Activate chain and perform initial skip
        tapStateRef.current = { zone, lastTime: now, chainActive: true };
        await performSkip(zone === 'left' ? -SKIP_SECONDS : SKIP_SECONDS);
      } else {
        // Too slow; re-arm without skipping
        tapStateRef.current = { zone, lastTime: now, chainActive: false };
        console.log(zone === 'left' ? '⏪ re-arm' : '⏩ re-arm');
      }
      return;
    }

    // Chain active: subsequent taps add more skips if within window
    if (elapsed <= CHAIN_WINDOW) {
      tapStateRef.current.lastTime = now;
  await performSkip(zone === 'left' ? -SKIP_SECONDS : SKIP_SECONDS);
    } else {

      
      // Chain expired; re-arm
      tapStateRef.current = { zone, lastTime: now, chainActive: false };
      console.log(zone === 'left' ? '⏪ chain expired (arm again)' : '⏩ chain expired (arm again)');
    }
  };

  const handlePlaybackStatus = (status) => {
    if (!status) return;

    // Notify parent when playback finishes
    if (status.didJustFinish && !status.isLooping) {
      if (typeof isPlaying !== 'boolean') {
        setInternalPlaying(false);
      }
      if (onPress) {
        onPress(false, video.id);
      }
      return;
    }

    // If native controls or other sources change playback state (play/pause),
    // we should only notify the parent when the parent is the authoritative
    // controller (i.e., `isPlaying` prop is provided). If the component is
    // managing local playback (`isPlaying` is undefined), just update local
    // internal state and do not call the parent handler to avoid races.
    if (showProgress && status.durationMillis && status.positionMillis >= 0) {
      const pct = Math.min(1, status.positionMillis / status.durationMillis);
      setProgress(pct);
    }

    if (typeof status.isPlaying === 'boolean') {
      const nowPlaying = status.isPlaying;
      if (typeof isPlaying === 'boolean') {
        // Parent controls playback: inform it of native changes so the
        // global `playingVideoId` stays in sync.
        if (onPress && nowPlaying !== playing) {
          onPress(nowPlaying, video.id);
        }
      } else {
        // Local playback control: just update internal state.
        setInternalPlaying(nowPlaying);
      }
    }
  };

  const toggleMute = () => {
    setMuted((m) => !m);
    const ref = videoRef.current;
    if (!ref) return;
    try {
      if (Platform.OS === 'web') {
        ref.muted = !muted;
      } else {
        ref.setIsMutedAsync(!muted);
      }
    } catch (e) {
      console.log('Mute toggle error:', e);
    }
  };

  const enterFullscreen = async () => {
    const ref = videoRef.current;
    if (!ref) return;
    try {
      if (Platform.OS === 'web') {
        if (ref.requestFullscreen) {
          await ref.requestFullscreen();
        }
      } else if (ref.presentFullscreenPlayer) {
        await ref.presentFullscreenPlayer();
      }
    } catch (e) {
      console.log('Fullscreen error:', e);
    }
  };

  return (
    // Use a non-touchable wrapper so horizontal swipes on the card are handled by FlatList.
    <View style={[styles.card, compact && styles.cardCompact]}>      
      <TouchableOpacity
        activeOpacity={1.0}
        onPress={handleVideoTap}
        onLayout={(e) => setAreaWidth(e.nativeEvent.layout.width)}
        style={[styles.videoArea, compact && styles.videoAreaCompact, forcedHeight ? { height: forcedHeight } : null]}
      >
        {video.videoUrl ? (
          // On web expo-av can be unreliable; render a native <video>
          // element for web so playback works in browsers.
          Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={video.videoUrl}
              style={StyleSheet.flatten([styles.video, { display: 'block', touchAction: 'none', userSelect: 'none' }])}
              playsInline
              muted={muted}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const locationX = e.clientX - rect.left;
                handleVideoTap({ nativeEvent: { locationX } });
              }}
              onDoubleClick={(e) => {
                // Prevent browser fullscreen / zoom
                e.preventDefault();
                e.stopPropagation();
                // Treat double click as a second tap to start chain quickly
                const rect = e.currentTarget.getBoundingClientRect();
                const locationX = e.clientX - rect.left;
                handleVideoTap({ nativeEvent: { locationX } });
              }}
            />
          ) : (
            <Video
              ref={videoRef}
              source={{ uri: video.videoUrl }}
              style={styles.video}
              resizeMode="cover"
              shouldPlay={playing}
              isLooping={false}
              isMuted={muted}
              useNativeControls={true}
              progressUpdateIntervalMillis={1000}
              onPlaybackStatusUpdate={handlePlaybackStatus}
              posterSource={video.thumbnailUrl ? { uri: video.thumbnailUrl } : undefined}
              usePoster={!playing}
            />
          )
        ) : video.thumbnailUrl ? (
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={styles.video}
            resizeMode="cover"
            defaultSource={require('../assets/icon.png')}
            fadeDuration={0}
          />
        ) : (
          <View style={styles.thumbnailFallback}>
            <Text style={styles.thumbnailText}>Video</Text>
          </View>
        )}

        {/* Overlays */}
        {!playing && (
          <View style={styles.playButtonOverlay} pointerEvents="none">
            <View style={styles.playButtonTouchable}>
              <Text style={styles.playIcon}>▶</Text>
            </View>
          </View>
        )}
        {showProgress && playing && (
          <View style={styles.progressBarWrapper} pointerEvents="none">
            <View style={styles.progressTrack} />
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
        )}
        {(allowMuteToggle || allowFullscreen) && (
          <View style={styles.controlsOverlay} pointerEvents="box-none">
            {allowMuteToggle && (
              <TouchableOpacity accessibilityLabel={muted ? 'Unmute video' : 'Mute video'} onPress={toggleMute} style={styles.smallControlBtn}>
                <Text style={styles.smallControlText}>{muted ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>
            )}
            {allowFullscreen && (
              <TouchableOpacity accessibilityLabel="Fullscreen video" onPress={enterFullscreen} style={styles.smallControlBtn}>
                <Text style={styles.smallControlText}>⛶</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>

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
    </View>
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
    // Professional shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },
  cardCompact: {
    width: 220,
    marginRight: 14,
  },
  videoArea: {
    backgroundColor: '#000',
    borderRadius: 16,
    height: 220,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // Inner shadow for video area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  videoAreaCompact: {
    // slightly larger compact height for a more premium feel
    height: 140,
  },
  progressBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#374151',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    height: 2,
    backgroundColor: '#F97316',
    borderRadius: 2,
  },
  video: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  playButtonOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 2,
    borderColor: '#F97316',
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
  controlsOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  smallControlBtn: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  smallControlText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  thumbnailFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailText: {
    color: '#4B5563',
    fontSize: 13,
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
