// components/Trending.jsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const TrendingCard = ({ title, author }) => (
  <View style={styles.card}>
    <View style={styles.thumbnail}>
      <Text style={styles.thumbnailText}>Video</Text>
    </View>
    <Text style={styles.title} numberOfLines={2}>
      {title}
    </Text>
    {author ? (
      <Text style={styles.author} numberOfLines={1}>
        {author}
      </Text>
    ) : null}
  </View>
);

const Trending = ({ posts }) => {
  if (!posts || posts.length === 0) {
    // No posts to show yet
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
          <TrendingCard
            title={item.title ?? 'Untitled video'}
            author={item.author ?? 'Unknown'}
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
  card: {
    width: 220,
    marginRight: 14,
  },
  thumbnail: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  thumbnailText: {
    color: '#4B5563',
    fontSize: 13,
  },
  title: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
  author: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
});
