// app/(tabs)/impact.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useKallpaExperience } from '../../hooks/useKallpaExperience';
import { formatDuration, formatRelativeTime } from '../../constants/kallpa';
import { getRecentKallpaSessions } from '../../lib/appwrite';

const riskColors = {
  low: '#22c55e',
  moderate: '#f97316',
  high: '#ef4444',
  abstain: '#ec4899',
};

const Impact = () => {
  const {
    impactProfiles,
    selectedImpactProfile,
    setSelectedImpactProfileId,
    sessionHistory,
  } = useKallpaExperience();

  const [remoteSessions, setRemoteSessions] = useState([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        setIsSessionsLoading(true);
        const latest = await getRecentKallpaSessions(25);
        if (isMounted) {
          setRemoteSessions(latest);
          setSessionsError(null);
        }
      } catch (error) {
        if (isMounted) {
          setSessionsError(error?.message ?? 'Unable to load remote sessions.');
        }
      } finally {
        if (isMounted) {
          setIsSessionsLoading(false);
        }
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 1000 * 60 * 5);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeProfile = selectedImpactProfile ?? impactProfiles[0];

  const selectProfile = (profileId) => {
    setSelectedImpactProfileId(profileId);
  };

  const riskLabels = activeProfile?.riskDistribution?.labels ?? [];
  const riskValues = activeProfile?.riskDistribution?.values ?? [];

  const deriveRiskTier = (score) => {
    if (typeof score !== 'number') return 'Unknown';
    if (score >= 80) return 'High';
    if (score >= 50) return 'Moderate';
    if (score >= 20) return 'Low';
    return 'Minimal';
  };

  const normalizedLocalSessions = useMemo(
    () =>
      (sessionHistory ?? []).map((session) => {
        const riskScore = session.riskScore ?? session.metadata?.risk_score ?? null;
        const decision = session.finalDecision ?? session.metadata?.decision ?? 'Pending';
        const startedAt = session.startedAt ?? Date.now();
        return {
          id: session.id ?? `local-${startedAt}`,
          scenarioId: session.scenarioId,
          durationMs: session.durationMs ?? session.metadata?.duration_ms ?? 0,
          decision,
          riskScore,
          riskTier: session.metadata?.risk_tier ?? deriveRiskTier(riskScore),
          startedAt,
          source: 'local',
          language: session.language ?? 'en',
        };
      }),
    [sessionHistory]
  );

  const normalizedRemoteSessions = useMemo(
    () =>
      remoteSessions.map((session) => {
        const riskScore = session.risk_score ?? session.metadata?.risk_score ?? null;
        const decision = session.decision ?? session.metadata?.decision ?? 'Pending';
        const created = session.created_at
          ? new Date(session.created_at).getTime()
          : Date.now();
        return {
          id: session.id ?? `remote-${created}`,
          scenarioId: session.scenario_id,
          durationMs: session.duration_ms ?? session.metadata?.duration_ms ?? 0,
          decision,
          riskScore,
          riskTier: session.metadata?.risk_tier ?? deriveRiskTier(riskScore),
          startedAt: created,
          source: 'remote',
          language: session.language ?? session.metadata?.language ?? 'en',
        };
      }),
    [remoteSessions]
  );

  const combinedSessions = useMemo(() => {
    const map = new Map();
    [...normalizedRemoteSessions, ...normalizedLocalSessions].forEach((session) => {
      map.set(session.id, session);
    });
    return Array.from(map.values()).sort((a, b) => b.startedAt - a.startedAt);
  }, [normalizedRemoteSessions, normalizedLocalSessions]);

  const sessionAnalytics = useMemo(() => {
    if (!combinedSessions.length) {
      return {
        total: 0,
        totalDurationMs: 0,
        averageDurationMs: 0,
        riskCounts: {},
        decisionCounts: {},
        sparkline: [],
        timeline: [],
      };
    }

    const totalDurationMs = combinedSessions.reduce(
      (sum, session) => sum + (session.durationMs ?? 0),
      0
    );
    const averageDurationMs = totalDurationMs / combinedSessions.length;

    const riskCounts = combinedSessions.reduce((acc, session) => {
      const tier = session.riskTier ?? 'Unknown';
      acc[tier] = (acc[tier] ?? 0) + 1;
      return acc;
    }, {});

    const decisionCounts = combinedSessions.reduce((acc, session) => {
      const label = session.decision ?? 'Pending';
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {});

    const sparkline = combinedSessions.slice(0, 12).reverse();
    const timeline = combinedSessions.slice(0, 8);

    return {
      total: combinedSessions.length,
      totalDurationMs,
      averageDurationMs,
      riskCounts,
      decisionCounts,
      sparkline,
      timeline,
    };
  }, [combinedSessions]);

  const renderSparkline = () => {
    const data = sessionAnalytics.sparkline;
    if (!data.length) return null;
    const maxValue = Math.max(...data.map((item) => item.durationMs || 1));
    return (
      <View style={styles.sparklineRow}>
        {data.map((point) => {
          const normalizedHeight = Math.max(
            8,
            Math.round(((point.durationMs ?? 0) / maxValue) * 60)
          );
          return (
            <View
              key={point.id}
              style={[
                styles.sparklineBar,
                point.source === 'remote' && styles.sparklineBarRemote,
                { height: normalizedHeight },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Kallpa PCAC</Text>
            <Text style={styles.title}>Impact & Safety Dashboard</Text>
          </View>
        </View>

        <View style={styles.analyticsSection}>
          <View style={styles.analyticsHeadingRow}>
            <View>
              <Text style={styles.sectionHeading}>Live session analytics</Text>
              <Text style={styles.sectionSubheading}>
                Blending local recordings with Supabase persistence to showcase safety deltas.
              </Text>
            </View>
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>
                {isSessionsLoading ? 'Syncing…' : `${sessionAnalytics.total} sessions`}
              </Text>
            </View>
          </View>

          {sessionsError ? (
            <View style={[styles.card, styles.analyticsCard]}>
              <Text style={styles.cardLabel}>Remote sync</Text>
              <Text style={styles.cardNarrative}>{sessionsError}</Text>
            </View>
          ) : null}

          {sessionAnalytics.total === 0 ? (
            <View style={[styles.card, styles.analyticsCard]}>
              <Text style={styles.cardLabel}>No recordings yet</Text>
              <Text style={styles.cardNarrative}>
                Start a Live Visit to populate throughput, decision and escalation trends.
              </Text>
            </View>
          ) : (
            <View style={styles.analyticsGrid}>
              <View style={[styles.card, styles.analyticsCard]}>
                <Text style={styles.cardLabel}>Recording minutes</Text>
                <Text style={styles.bigNumber}>
                  {Math.round(sessionAnalytics.totalDurationMs / 60000)}m
                </Text>
                <Text style={styles.cardNarrative}>
                  Avg {formatDuration(Math.round(sessionAnalytics.averageDurationMs))} per encounter
                </Text>
                {renderSparkline()}
                <Text style={styles.sparklineCaption}>Past {sessionAnalytics.sparkline.length} sessions</Text>
              </View>

              <View style={[styles.card, styles.analyticsCard]}>
                <Text style={styles.cardLabel}>Risk tier mix</Text>
                <View style={styles.riskChipsRow}>
                  {Object.entries(sessionAnalytics.riskCounts).map(([tier, count]) => (
                    <View key={tier} style={styles.riskChip}>
                      <Text style={styles.riskChipLabel}>{tier}</Text>
                      <Text style={styles.riskChipValue}>{count}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.cardNarrative}>
                  Tracks fall-out from ABSTAINs vs escalations in the last {sessionAnalytics.total} recordings.
                </Text>
              </View>

              <View style={[styles.card, styles.analyticsCard]}>
                <Text style={styles.cardLabel}>Decision pathways</Text>
                <View style={styles.riskChipsRow}>
                  {Object.entries(sessionAnalytics.decisionCounts).map(([decision, count]) => (
                    <View key={decision} style={styles.decisionPill}>
                      <Text style={styles.decisionPillLabel}>{decision}</Text>
                      <Text style={styles.decisionPillValue}>{count}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.cardNarrative}>
                  Use for escalation QA: confirm Kallpa-assisted outcomes align with policy.
                </Text>
              </View>
            </View>
          )}

          {sessionAnalytics.timeline.length ? (
            <View style={[styles.card, styles.timelineCard]}>
              <View style={styles.timelineHeaderRow}>
                <Text style={styles.cardLabel}>Timeline</Text>
                <Text style={styles.timelineMeta}>Newest {sessionAnalytics.timeline.length} sessions</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timelineStrip}>
                {sessionAnalytics.timeline.map((session) => (
                  <View
                    key={session.id}
                    style={[styles.timelineChip, session.source === 'remote' && styles.timelineChipRemote]}
                  >
                    <Text style={styles.timelineChipTitle} numberOfLines={1}>
                      {session.decision}
                    </Text>
                    <Text style={styles.timelineChipMeta}>
                      {session.riskTier} • {formatRelativeTime(session.startedAt)}
                    </Text>
                    <Text style={styles.timelineChipMeta}>
                      {Math.round((session.durationMs ?? 0) / 1000)}s · {session.source}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.profileStrip}
        >
          {impactProfiles.map((profile) => {
            const isActive = profile.id === activeProfile?.id;
            return (
              <Pressable
                key={profile.id}
                onPress={() => selectProfile(profile.id)}
                style={[
                  styles.profileCard,
                  isActive && styles.profileCardActive,
                ]}
              >
                <Text style={styles.profileLabel}>{profile.label}</Text>
                <Text style={styles.profileDelta}>{profile.throughput.caption}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {activeProfile && (
          <View style={styles.cardsGrid}>
            <View style={[styles.card, styles.throughputCard]}>
              <Text style={styles.cardLabel}>Throughput</Text>
              <Text style={styles.bigNumber}>{activeProfile.throughput.deltaPct}%</Text>
              <Text style={styles.cardNarrative}>{activeProfile.throughput.caption}</Text>
              <View style={styles.metricRow}>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>Baseline</Text>
                  <Text style={styles.metricValue}>{activeProfile.throughput.baseline}/hr</Text>
                </View>
                <View style={styles.metricColumn}>
                  <Text style={styles.metricLabel}>Kallpa assisted</Text>
                  <Text style={styles.metricValue}>{activeProfile.throughput.assisted}/hr</Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, styles.chartCard]}>
              <Text style={styles.cardLabel}>Risk distribution</Text>
              <View style={styles.riskBar}>
                {riskLabels.map((label, index) => {
                  const normalized = label.replace(/\s+/g, '').toLowerCase();
                  const backgroundColor = riskColors[normalized] ?? '#1f2937';
                  return (
                    <View
                      key={label}
                      style={[styles.riskSegment, { flex: riskValues[index] || 0, backgroundColor }]}
                    >
                      <Text style={styles.riskSegmentText}>{riskValues[index]}%</Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.riskLegend}>
                {riskLabels.map((label) => {
                  const normalized = label.replace(/\s+/g, '').toLowerCase();
                  return (
                    <View key={label} style={styles.riskLegendItem}>
                      <View
                        style={[
                          styles.riskLegendDot,
                          { backgroundColor: riskColors[normalized] ?? '#1f2937' },
                        ]}
                      />
                      <Text style={styles.riskLegendLabel}>{label}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.cardNarrative}>
                {activeProfile.riskDistribution.narrative}
              </Text>
            </View>

            <View style={[styles.card, styles.chartCard]}>
              <Text style={styles.cardLabel}>Language equity</Text>
              <View style={styles.languageChart}>
                {activeProfile.languageEquity.metrics.map((metric) => (
                  <View key={metric.label} style={styles.languageRow}>
                    <Text style={styles.languageLabel}>{metric.label}</Text>
                    <View style={styles.languageBars}>
                      <LinearGradient
                        colors={[ '#22d3ee', '#38bdf8' ]}
                        style={[styles.languageBar, { flex: metric.en }]}
                      >
                        <Text style={styles.languageBarText}>EN {metric.en}%</Text>
                      </LinearGradient>
                      <LinearGradient
                        colors={[ '#fb7185', '#f43f5e' ]}
                        style={[styles.languageBar, { flex: metric.es }]}
                      >
                        <Text style={styles.languageBarText}>ES {metric.es}%</Text>
                      </LinearGradient>
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.cardNarrative}>
                {activeProfile.languageEquity.narrative}
              </Text>
            </View>

            <View style={[styles.card, styles.chartCard]}>
              <Text style={styles.cardLabel}>Documentation</Text>
              <View style={styles.docStatsRow}>
                <View style={styles.docStat}>
                  <Text style={styles.bigNumber}>{activeProfile.documentation.noteCompleteness}%</Text>
                  <Text style={styles.metricLabel}>complete notes</Text>
                </View>
                <View style={styles.docStat}>
                  <Text style={styles.bigNumber}>{activeProfile.documentation.guidelineAdherence}%</Text>
                  <Text style={styles.metricLabel}>guideline concordant</Text>
                </View>
              </View>
              <Text style={styles.cardNarrative}>
                {activeProfile.documentation.narrative}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Impact;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#010409',
  },
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubheading: {
    color: '#94a3b8',
    marginTop: 4,
    fontSize: 13,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  profileStrip: {
    marginTop: 10,
  },
  analyticsSection: {
    gap: 16,
  },
  analyticsHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginRight: 12,
    width: 240,
    gap: 6,
  },
  tagChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  tagText: {
    color: '#e2e8f0',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  profileCardActive: {
    borderColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  profileLabel: {
    color: '#f1f5f9',
    fontWeight: '700',
  },
  profileDelta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  cardsGrid: {
    gap: 16,
  },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    gap: 12,
  },
  throughputCard: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(34,211,238,0.35)',
  },
  cardLabel: {
    color: '#94a3b8',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bigNumber: {
    color: '#f8fafc',
    fontSize: 40,
    fontWeight: '800',
  },
  analyticsGrid: {
    gap: 16,
  },
  analyticsCard: {
    backgroundColor: '#020b1a',
    borderColor: 'rgba(14,165,233,0.35)',
  },
  cardNarrative: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 18,
  },
  sparklineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 12,
    height: 70,
  },
  sparklineBar: {
    width: 8,
    borderRadius: 4,
    backgroundColor: '#38bdf8',
  },
  sparklineBarRemote: {
    backgroundColor: '#f472b6',
  },
  sparklineCaption: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricColumn: {
    gap: 4,
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(37,99,235,0.25)',
  },
  riskBar: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
  },
  riskSegment: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    paddingVertical: 14,
  },
  riskSegmentText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  riskLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  riskLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  riskLegendLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  languageChart: {
    gap: 12,
  },
  languageRow: {
    gap: 8,
  },
  languageLabel: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  languageBars: {
    flexDirection: 'row',
    gap: 8,
  },
  languageBar: {
    borderRadius: 12,
    padding: 8,
  },
  languageBarText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  docStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  docStat: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  riskChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  riskChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
  },
  riskChipLabel: {
    color: '#bae6fd',
    fontWeight: '600',
    fontSize: 12,
  },
  riskChipValue: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  decisionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: 'rgba(251,146,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.45)',
  },
  decisionPillLabel: {
    color: '#fed7aa',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  decisionPillValue: {
    color: '#fef3c7',
    fontWeight: '700',
    fontSize: 18,
  },
  timelineCard: {
    gap: 12,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  timelineStrip: {
    marginTop: 4,
  },
  timelineChip: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#0a192f',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginRight: 12,
    width: 180,
    gap: 4,
  },
  timelineChipRemote: {
    borderColor: 'rgba(244,114,182,0.4)',
    backgroundColor: 'rgba(244,114,182,0.1)',
  },
  timelineChipTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  timelineChipMeta: {
    color: '#cbd5f5',
    fontSize: 12,
  },
});
