// app/(tabs)/profile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { useGlobalContext } from '../../context/GlobalProvider';
import { useKallpaExperience } from '../../hooks/useKallpaExperience';
import { getRecentManualCases } from '../../lib/appwrite';

const Profile = () => {
  const router = useRouter();
  const { user, logout, isAuthLoading } = useGlobalContext();
  const {
    scenarios,
    selectedScenario,
    selectedImpactProfile,
  } = useKallpaExperience();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [manualCases, setManualCases] = useState([]);
  const [isCasesLoading, setIsCasesLoading] = useState(false);
  const [casesError, setCasesError] = useState(null);

  const username = useMemo(() => {
    const metaName = user?.user_metadata?.username;
    if (metaName && metaName.trim().length > 0) return metaName.trim();

    const emailPart = user?.email?.split('@')[0];
    if (emailPart && emailPart.length > 0) return emailPart;

    return 'User';
  }, [user]);

  const userEmail = user?.email ?? 'guest@example.com';
  const facility = user?.user_metadata?.facility ?? 'Kallpa Operator';
  const credential = user?.user_metadata?.credential ?? 'PCAC Clinician-in-training';

  const avatarInitials = useMemo(() => {
    const parts = username.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  }, [username]);

  const accentColor = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < username.length; i += 1) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 85%, 62%)`;
  }, [username]);

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

  useEffect(() => {
    let isMounted = true;

    const fetchCases = async () => {
      try {
        setIsCasesLoading(true);
        const cases = await getRecentManualCases(5);
        if (isMounted) {
          setManualCases(cases ?? []);
          setCasesError(null);
        }
      } catch (error) {
        if (isMounted) {
          setCasesError(error?.message ?? 'Unable to load Supabase cases.');
        }
      } finally {
        if (isMounted) {
          setIsCasesLoading(false);
        }
      }
    };

    fetchCases();
    const interval = setInterval(fetchCases, 1000 * 60 * 5);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isAuthLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#F97316" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }
  const quickLinks = [
    {
      title: 'Live Visit',
      subtitle: 'Step into bilingual simulation',
      emoji: '🩺',
      target: '/(tabs)/visit',
    },
    {
      title: 'Case Studio',
      subtitle: 'Review escalation playbooks',
      emoji: '📚',
      target: '/(tabs)/cases',
    },
    {
      title: 'Impact Dashboard',
      subtitle: 'Show throughput & equity',
      emoji: '📈',
      target: '/(tabs)/impact',
    },
  ];

  const throughputDelta = selectedImpactProfile?.throughput?.deltaPct ?? 0;
  const throughputCaption = selectedImpactProfile?.throughput?.caption ?? '';
  const abstainNarrative = selectedImpactProfile?.riskDistribution?.narrative ?? '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[accentColor, '#0f172a']}
            style={styles.heroGradient}
          />
          <View style={styles.heroContent}>
            <View style={[styles.avatar, { borderColor: '#f8fafc' }] }>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
            <Text style={styles.heroLabel}>Kallpa Operator</Text>
            <Text style={styles.heroTitle}>{username}</Text>
            <Text style={styles.heroSubtitle}>{credential}</Text>
            <Text style={styles.heroSubtitle}>{facility}</Text>
            <View style={styles.tagRow}>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>{userEmail}</Text>
              </View>
              <View style={styles.tagChip}>
                <Text style={styles.tagText}>{scenarios.length} scenarios</Text>
              </View>
            </View>
          </View>
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Text style={styles.logoutButtonText}>
              {isLoggingOut ? 'Logging out…' : 'Logout'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Current signal</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Active scenario</Text>
              <Text style={styles.infoValue}>
                {selectedScenario?.title ?? 'Select in Visit tab'}
              </Text>
              <Text style={styles.infoMeta}>
                {selectedScenario?.heroStats?.decisionLabel ?? ''}
              </Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Throughput delta</Text>
              <Text style={styles.infoValue}>{throughputDelta}%</Text>
              <Text style={styles.infoMeta}>{throughputCaption}</Text>
            </View>
            <View style={styles.infoCardWide}>
              <Text style={styles.infoLabel}>Safety narrative</Text>
              <Text style={styles.infoMeta}>{abstainNarrative}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Quick actions</Text>
          <View style={styles.actionGrid}>
            {quickLinks.map((link) => (
              <Pressable
                key={link.title}
                style={styles.actionTile}
                onPress={() => router.push(link.target)}
              >
                <Text style={styles.actionEmoji}>{link.emoji}</Text>
                <Text style={styles.actionTitle}>{link.title}</Text>
                <Text style={styles.actionSubtitle}>{link.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Guidance</Text>
          <View style={styles.guidanceCard}>
            <Text style={styles.guidanceText}>
              Maintain bilingual parity, document explainability, and surface ABSTAIN calls proactively. Use Live Visit to demonstrate decision transparency, Case Studio for research narratives, and Impact to show ROI.
            </Text>
            <Text style={styles.disclaimer}>Demo only • Not for clinical use</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Admin sync</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCardWide}>
              <View style={styles.adminHeaderRow}>
                <Text style={styles.infoLabel}>Last 5 manual cases</Text>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>
                    {isCasesLoading ? 'Syncing…' : `${manualCases.length} loaded`}
                  </Text>
                </View>
              </View>
              {casesError ? (
                <Text style={[styles.infoMeta, styles.errorText]}>{casesError}</Text>
              ) : null}
              {!casesError && !manualCases.length && !isCasesLoading ? (
                <Text style={styles.infoMeta}>
                  No Supabase captures yet. Save a manual encounter in Case Studio to verify replication.
                </Text>
              ) : null}

              {manualCases.map((manualCase) => (
                <View key={manualCase.id} style={styles.caseRow}>
                  <View style={styles.caseTextCol}>
                    <Text style={styles.caseTitle}>{manualCase.title}</Text>
                    <Text style={styles.caseMeta}>
                      {manualCase.clinic_type ?? 'Manual capture'} • {new Date(manualCase.created_at).toLocaleString()}
                    </Text>
                    <Text style={styles.caseMeta}>{manualCase.language?.toUpperCase?.() ?? 'EN'}</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.caseAttachmentRow}
                  >
                    {(manualCase.attachments ?? []).slice(0, 3).map((attachment) => (
                      <View key={`${manualCase.id}-${attachment.id}`} style={styles.attachmentThumbCard}>
                        <Image
                          source={{
                            uri:
                              attachment.previewUri ||
                              attachment.thumbnail ||
                              attachment.url ||
                              'https://placehold.co/96x96?text=asset',
                          }}
                          style={styles.attachmentThumbImage}
                        />
                        <Text style={styles.attachmentThumbLabel} numberOfLines={1}>
                          {attachment.label ?? attachment.id}
                        </Text>
                      </View>
                    ))}
                    {manualCase.attachments?.length > 3 ? (
                      <View style={styles.attachmentsOverflowPill}>
                        <Text style={styles.attachmentsOverflowText}>+{manualCase.attachments.length - 3} more</Text>
                      </View>
                    ) : null}
                  </ScrollView>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
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
  container: {
    padding: 20,
    gap: 24,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.15)',
    backgroundColor: '#0b1120',
    position: 'relative',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  heroContent: {
    padding: 24,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,6,23,0.6)',
    marginBottom: 8,
  },
  avatarText: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  heroLabel: {
    color: '#bae6fd',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: '#cbd5f5',
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    color: '#f8fafc',
    fontSize: 12,
  },
  logoutButton: {
    borderTopWidth: 1,
    borderColor: 'rgba(248,250,252,0.15)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  section: {
    gap: 12,
  },
  sectionHeading: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  infoGrid: {
    gap: 12,
  },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  infoCardWide: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  infoMeta: {
    color: '#cbd5f5',
    marginTop: 4,
  },
  errorText: {
    color: '#fca5a5',
  },
  actionGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  actionTile: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    gap: 4,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  actionSubtitle: {
    color: '#94a3b8',
  },
  guidanceCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
  },
  guidanceText: {
    color: '#cbd5f5',
    lineHeight: 20,
  },
  disclaimer: {
    color: '#f87171',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 12,
    letterSpacing: 0.4,
  },
  adminHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  caseRow: {
    borderTopWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    paddingVertical: 12,
    gap: 8,
  },
  caseTextCol: {
    gap: 4,
  },
  caseTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  caseMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  caseAttachmentRow: {
    gap: 8,
  },
  attachmentThumbCard: {
    width: 96,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    padding: 8,
    alignItems: 'center',
    gap: 6,
  },
  attachmentThumbImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  attachmentThumbLabel: {
    color: '#cbd5f5',
    fontSize: 11,
  },
  attachmentsOverflowPill: {
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.2)',
    justifyContent: 'center',
  },
  attachmentsOverflowText: {
    color: '#f8fafc',
    fontSize: 12,
  },
});
