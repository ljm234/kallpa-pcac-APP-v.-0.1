// app/(tabs)/home.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchInput from '../../components/SearchInput';
import Trending from '../../components/Trending';
import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useAppwrite } from '../../hooks/useAppwrite';
import { getAllPosts } from '../../lib/appwrite';

const getAccentFromName = (name) => {
  if (!name) {
    return {
      solid: 'hsl(22, 90%, 58%)',
      soft: 'hsla(22, 90%, 58%, 0.18)',
    };
  }

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  return {
    solid: `hsl(${hue}, 85%, 62%)`,
    soft: `hsla(${hue}, 85%, 62%, 0.18)`,
  };
};

const Home = () => {
  const { user } = useGlobalContext();

  // Use the custom hook for fetching posts
  const { data: posts, isLoading, refetch } = useAppwrite(getAllPosts);

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const username = useMemo(() => {
    const metaName = user?.user_metadata?.username;
    if (metaName && metaName.trim().length > 0) return metaName.trim();

    const emailPart = user?.email?.split('@')[0];
    if (emailPart && emailPart.length > 0) return emailPart;

    return 'Researcher';
  }, [user]);

  const accent = useMemo(() => getAccentFromName(username), [username]);

  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return posts;

    const q = searchQuery.toLowerCase();
    return posts.filter(
      (post) =>
        (post.title ?? '').toLowerCase().includes(q) ||
        (post.author ?? '').toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const handleSearch = () => {
    console.log('Searching videos for:', searchQuery);
  };

  // Track which videos are playing
  const [playingVideos, setPlayingVideos] = useState({});

  const handleVideoPress = (isPlaying, videoId) => {
    setPlayingVideos((prev) => ({
      ...prev,
      [videoId]: isPlaying,
    }));
  };

  const renderPostCard = ({ item }) => (
    <VideoCard
      video={item}
      compact={false}
      onPress={handleVideoPress}
    />
  );

  // Top "Trending" row (horizontal)
  const trendingPosts = useMemo(
    () => filteredPosts.slice(0, 5),
    [filteredPosts]
  );

  const listHeader = (
    <View style={styles.header}>
      {/* Top row: greeting + avatar */}
      <View style={styles.headerTop}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{username}</Text>

          {/* Dynamic accent chip */}
          <View
            style={[
              styles.usernameChip,
              { backgroundColor: accent.soft, borderColor: accent.solid },
            ]}
          >
            <View
              style={[styles.usernameDot, { backgroundColor: accent.solid }]}
            />
            <Text
              style={[styles.usernameChipText, { color: accent.solid }]}
              numberOfLines={1}
            >
              Signed in as {user?.email ?? 'guest'}
            </Text>
          </View>
        </View>

        {/* Initials avatar with accent border */}
        <View
          style={[
            styles.logoWrapper,
            { borderColor: accent.solid },
          ]}
        >
          <Text style={[styles.logoText, { color: accent.solid }]}>JM</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Here are the latest JM Labs videos and experiments.
      </Text>

      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmit={handleSearch}
      />

      {/* Horizontal Trending row */}
      <Trending posts={trendingPosts} onVideoPress={handleVideoPress} />

      {/* Only show "Latest videos" when we have data */}
      {filteredPosts.length > 0 && (
        <Text style={styles.sectionTitle}>Latest Videos</Text>
      )}
    </View>
  );

  if (isLoading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPostCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            title="No videos yet"
            subtitle="Be the first one to upload a video."
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#f97316"
          />
        }
      />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617', // slate-950
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  loadingWrapper: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#9CA3AF',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  username: {
    color: '#F9FAFB',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 2,
  },
  usernameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  usernameDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    marginRight: 6,
  },
  usernameChipText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  logoWrapper: {
    width: 46,
    height: 46,
    borderRadius: 999,
    backgroundColor: '#020617',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  },
  logoText: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 1,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
});
