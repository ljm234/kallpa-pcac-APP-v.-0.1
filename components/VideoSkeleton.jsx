// components/VideoSkeleton.jsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

// Simple shimmer skeleton for premium loading feel
export default function VideoSkeleton({ width = 260, height = 146, borderRadius = 20 }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <View style={[styles.wrapper, { width, borderRadius }]}>      
      <Animated.View style={[styles.block, { width: '100%', height, borderRadius, opacity }]} />
      <Animated.View style={[styles.line, { width: '70%', opacity, borderRadius: borderRadius * 0.4 }]} />
      <Animated.View style={[styles.line, { width: '55%', opacity, borderRadius: borderRadius * 0.4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  block: { backgroundColor: '#1F2937' },
  line: { height: 14, backgroundColor: '#1F2937', marginTop: 8 },
});