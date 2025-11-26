// app/(tabs)/profile.jsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import VideoCard from '../../components/VideoCard';
import EmptyState from '../../components/EmptyState';
import InfoBox from '../../components/InfoBox';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useAppwrite } from '../../hooks/useAppwrite';
import { getUserPosts } from '../../lib/appwrite';

const Profile = () => {
  const router = useRouter();
  const { user, logout } = useGlobalContext();
  const userId = user?.id;

  const { data: userPosts, isLoading, refetch } = useAppwrite(() => getUserPosts(userId));

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [playingVideoId, setPlayingVideoId] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const username = useMemo(() => {
    const metaName = user?.user_metadata?.username;
    if (metaName && metaName.trim().length > 0) return metaName.trim();

    const emailPart = user?.email?.split('@')[0];
    if (emailPart && emailPart.length > 0) return emailPart;

    return 'User';
  }, [user]);

  const userEmail = user?.email ?? 'guest@example.com';

  // Generate avatar initials from username
  const avatarInitials = useMemo(() => {
    const parts = username.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  }, [username]);

  // Generate accent color from username
  const accentColor = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < username.length; i += 1) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 85%, 62%)`;
  }, [username]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to log out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleVideoPress = (nextPlaying, videoId) => {
    if (nextPlaying) {
      setPlayingVideoId(videoId);
    } else {
      setPlayingVideoId((current) => (current === videoId ? null : current));
    }
  };

  const renderVideoCard = ({ item }) => (
    <VideoCard
      video={item}
      compact={false}
      isPlaying={playingVideoId === item.id}
      onPress={handleVideoPress}
    />
  );

  const listHeader = (
    <View style={styles.header}>
      {/* Logout Button - Top Right */}
      <View style={styles.logoutRow}>
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoggingOut}
          style={[
            styles.logoutButton,
            isLoggingOut && styles.logoutButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.logoutIcon}>{isLoggingOut ? '⏳' : '🚪'}</Text>
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* User Avatar */}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatar, { borderColor: accentColor }]}>
          <Text style={[styles.avatarText, { color: accentColor }]}>
            {avatarInitials}
          </Text>
        </View>
      </View>

      {/* Username and Email */}
      <Text style={styles.username}>{username}</Text>
      <Text style={styles.email}>{userEmail}</Text>

      {/* Stats - Posts & Views */}
      <View style={styles.statsRow}>
        <InfoBox
          title={String(userPosts?.length ?? 0)}
          subtitle="Posts"
          containerStyle={styles.statBox}
        />
        <View style={styles.statDivider} />
        <InfoBox
          title="1.2k"
          subtitle="Followers"
          containerStyle={styles.statBox}
        />
      </View>

      {/* Section Title */}
      {userPosts && userPosts.length > 0 && (
        <Text style={styles.sectionTitle}>Your Videos</Text>
      )}
    </View>
  );

  if (isLoading && (!userPosts || userPosts.length === 0)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={userPosts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderVideoCard}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <EmptyState
            title="No videos yet"
            subtitle="Upload your first video to get started!"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#F97316"
          />
        }
      />
    </SafeAreaView>
  );
};

export default Profile;

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
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  logoutRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3,
        }),
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1F2937',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
  },
  username: {
    color: '#F9FAFB',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  email: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 4,
        }),
  },
  statBox: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
    marginHorizontal: 12,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
});
