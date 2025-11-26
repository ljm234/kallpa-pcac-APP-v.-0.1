// app/search/[query].jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import SearchInput from '../../components/SearchInput';
import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import { useAppwrite } from '../../hooks/useAppwrite';
import { searchPosts } from '../../lib/appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Shared key used in SearchInput for persistence
const SEARCH_HISTORY_KEY = '@search_history';

function Search() {
  const { query } = useLocalSearchParams();
  const router = useRouter();

  // Local input to reflect user typing instantly in the label and field
  const [input, setInput] = useState(String(query || ''));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);

  const { data: results, isLoading, refetch } = useAppwrite(() => searchPosts(String(query || '')));

  // Keep input in sync if user navigates to a different query
  useEffect(() => {
    setInput(String(query || ''));
    // Automatically refresh when the query param changes
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Persist query param into search history whenever route changes (user typed & debounced navigation or direct link)
  useEffect(() => {
    const q = String(query || '').trim();
    if (!q) return;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        const arr = stored ? JSON.parse(stored) : [];
        const next = [q, ...arr.filter((h) => h !== q)].slice(0, 2);
        await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      } catch (e) {
        // Silent — history is nice-to-have
        console.log('Failed to persist query history on route change:', e);
      }
    })();
  }, [query]);

  // Auto-search as user types - update route with debounce for better UX
  useEffect(() => {
    const trimmed = input.trim();
    
    if (trimmed === '') {
      // User cleared the search - go back to home to show all videos
      router.push('/home');
      return;
    }

    // Update the route to trigger search (debounced to avoid too many navigations)
    const timer = setTimeout(() => {
      if (trimmed !== String(query || '').trim()) {
        router.replace(`/search/${encodeURIComponent(trimmed)}`);
      }
    }, 500); // 500ms debounce - gives time to see/select from dropdown

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const handleSubmit = () => {
    const q = String(input || '').trim();
    if (!q) {
      // If empty, navigate to home to show all videos
      router.push('/home');
      return;
    }
    router.push(`/search/${encodeURIComponent(q)}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVideoPress = (nextPlaying, videoId) => {
    if (nextPlaying) setPlayingVideoId(videoId);
    else setPlayingVideoId((current) => (current === videoId ? null : current));
  };

  const renderCard = ({ item }) => (
    <VideoCard
      video={item}
      isPlaying={playingVideoId === item.id}
      onPress={handleVideoPress}
    />
  );

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.pageTitle}>Search Results</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {input ? `Search results for "${input}"` : 'Type to search for videos'}
      </Text>

      <SearchInput value={input} onChangeText={setInput} onSubmit={handleSubmit} />

      {results && results.length > 0 && (
        <Text style={styles.sectionTitle}>Videos</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {isLoading && (!results || results.length === 0) ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              title={input ? `No videos found for "${input}"` : 'No search yet'}
              subtitle={input ? 'Try a different term or check your spelling.' : 'Use the search box above to get started.'}
            />
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#f97316"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

export default Search;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
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
    gap: 12,
    zIndex: 1000,
  },
  pageTitle: {
    color: '#F9FAFB',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
});
