// app/(tabs)/home.jsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SearchInput from '../../components/SearchInput';
import { useGlobalContext } from '../../context/GlobalProvider';

// Simple mock data for "Latest Videos"
const MOCK_VIDEOS = [
  {
    id: 'v1',
    title: 'ER stress pathways in Naegleria fowleri',
    author: 'Jordan Montenegro',
  },
  {
    id: 'v2',
    title: 'Intro to JM Labs: organizing experiments and notes',
    author: 'Jordan Montenegro',
  },
  {
    id: 'v3',
    title: 'Designing better lab notebooks with React Native',
    author: 'Jordan Montenegro',
  },
  {
    id: 'v4',
    title: 'Clinical AI: from prototype to practice',
    author: 'Jordan Montenegro',
  },
];

// Turn the username into a consistent accent color
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
  const [searchQuery, setSearchQuery] = useState('');

  const username = useMemo(() => {
    const metaName = user?.user_metadata?.username;
    if (metaName && metaName.trim().length > 0) return metaName.trim();

    const emailPart = user?.email?.split('@')[0];
    if (emailPart && emailPart.length > 0) return emailPart;

    return 'Researcher';
  }, [user]);

  const accent = useMemo(() => getAccentFromName(username), [username]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return MOCK_VIDEOS;

    const query = searchQuery.toLowerCase();
    return MOCK_VIDEOS.filter(
      (video) =>
        video.title.toLowerCase().includes(query) ||
        video.author.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearch = () => {
    console.log('Searching videos for:', searchQuery);
  };

  const renderVideoCard = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.videoBadge, { color: accent.solid }]}>
          {index === 0 ? 'Trending' : 'Recent'}
        </Text>
        <Text style={styles.videoMetaRight}>5 min watch</Text>
      </View>

      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoPlaceholderText}>Video placeholder</Text>
      </View>

      <Text style={styles.videoTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.videoMeta}>{item.author}</Text>
    </View>
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

      <Text style={styles.sectionTitle}>Latest Videos</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={filteredVideos}
        keyExtractor={(item) => item.id}
        renderItem={renderVideoCard}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  card: {
    borderRadius: 24,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 28,
    elevation: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  videoBadge: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  videoMetaRight: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  videoPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  videoPlaceholderText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  videoTitle: {
    color: '#F9FAFB',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  videoMeta: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
  },
});
