// components/Trending.jsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import VideoCard from './VideoCard';

const Trending = ({ posts, onVideoPress }) => {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Trending</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 4 }}
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            compact={true}
            onPress={onVideoPress}
          />
        )}
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
});
