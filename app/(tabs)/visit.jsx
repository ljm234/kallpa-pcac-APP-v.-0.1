// app/(tabs)/visit.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useKallpaExperience } from '../../hooks/useKallpaExperience';
import {
  labFlagColors,
  formatDuration,
  formatRelativeTime,
} from '../../constants/kallpa';

const riskTierPalette = {
  low: {
    label: 'Low',
    fill: ['#0ea5e9', '#14b8a6'],
    text: '#14b8a6',
  },
  moderate: {
    label: 'Moderate',
    fill: ['#f97316', '#fb923c'],
    text: '#fb923c',
  },
  high: {
    label: 'High',
    fill: ['#ef4444', '#f97316'],
    text: '#f97316',
  },
  critical: {
    label: 'Critical',
    fill: ['#f43f5e', '#ef4444'],
    text: '#f43f5e',
  },
};

const decisionPalette = {
  manage: { label: 'Manage in clinic', color: '#14b8a6' },
  escalate: { label: 'Escalate', color: '#f97316' },
  abstain: { label: 'ABSTAIN', color: '#f43f5e' },
};

const roleTheme = {
  patient: {
    label: 'Patient',
    alignment: 'flex-start',
    bubble: '#0f172a',
    border: 'rgba(59,130,246,0.4)',
  },
  clinician: {
    label: 'Clinician',
    alignment: 'flex-end',
    bubble: '#1e1b4b',
    border: 'rgba(248,113,113,0.45)',
  },
  pcac: {
    label: 'PCAC',
    alignment: 'center',
    bubble: '#14532d',
    border: 'rgba(16,185,129,0.5)',
  },
};


const Visit = () => {
  const {
    scenarios,
    selectedScenario,
    selectedScenarioId,
    selectScenario,
    transcript,
    chips,
    activeVariants,
    toggleVariant,
    panelState,
    language,
    setLanguage,
    clinicalHistory,
    labs,
    attachments,
    recording,
    startRecording,
    stopRecording,
    logRecordingEvent,
    sessionHistory,
  } = useKallpaExperience();
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isExplainVisible, setExplainVisible] = useState(false);

  const transcriptTurns = transcript ?? [];
  const labsRows = useMemo(() => (Array.isArray(labs) ? labs : []), [labs]);
  const attachmentList = useMemo(
    () => (Array.isArray(attachments) ? attachments : []),
    [attachments]
  );
  const historyEntries = useMemo(() => {
    if (!clinicalHistory) return [];
    const sections = [
      { label: 'Past medical', values: clinicalHistory.pastMedical },
      { label: 'Medications', values: clinicalHistory.medications },
      { label: 'Allergies', values: clinicalHistory.allergies },
      { label: 'Social', values: clinicalHistory.social },
      {
        label: 'Notes',
        values: clinicalHistory.notes ? [clinicalHistory.notes] : [],
      },
    ];
    return sections.filter((section) => section.values && section.values.length);
  }, [clinicalHistory]);
  const lastSession = sessionHistory?.[0];
  const timelineEvents = useMemo(() => {
    const sourceEvents = recording.isRecording
      ? recording.events
      : lastSession?.events ?? [];
    const events = Array.isArray(sourceEvents) ? sourceEvents : [];
    return events.slice(-4).reverse();
  }, [lastSession, recording.events, recording.isRecording]);
  const recordingStatusColor = recording.isRecording ? '#22d3ee' : '#94a3b8';
  const lastSessionSummary = lastSession
    ? `${formatDuration(lastSession.durationMs)} · ${formatRelativeTime(
        lastSession.startedAt
      )}`
    : 'No captured sessions yet.';

  useEffect(() => {
    setCurrentTurnIndex(0);
    setIsAutoPlay(false);
  }, [selectedScenarioId]);

  useEffect(() => {
    if (!isAutoPlay) return undefined;
    if (!transcriptTurns.length) return undefined;
    if (currentTurnIndex >= transcriptTurns.length - 1) {
      const timer = setTimeout(() => setIsAutoPlay(false), 600);
      return () => clearTimeout(timer);
    }

    const nextDelay = transcriptTurns[currentTurnIndex + 1]?.delayMs ?? 1500;
    const timer = setTimeout(() => {
      setCurrentTurnIndex((prev) =>
        Math.min(prev + 1, transcriptTurns.length - 1)
      );
    }, Math.max(nextDelay, 500));

    return () => clearTimeout(timer);
  }, [isAutoPlay, currentTurnIndex, transcriptTurns]);

  useEffect(() => {
    if (!recording.isRecording) return undefined;
    logRecordingEvent({
      type: 'scenario-change',
      scenarioId: selectedScenarioId,
      scenarioTitle: selectedScenario?.title,
      content: selectedScenario?.title,
    });
    return undefined;
  }, [logRecordingEvent, recording.isRecording, selectedScenario?.title, selectedScenarioId]);

  useEffect(() => {
    if (!recording.isRecording) return;
    logRecordingEvent({
      type: 'variant-state',
      activeVariants,
      content: activeVariants.length ? activeVariants.join(', ') : 'Base variant',
    });
  }, [activeVariants, logRecordingEvent, recording.isRecording]);

  useEffect(() => {
    if (!recording.isRecording) return;
    const turn = transcriptTurns[currentTurnIndex];
    if (!turn) return;
    const turnContent =
      turn.localeText?.[language] ?? turn.localeText?.en ?? 'Turn recorded';
    logRecordingEvent({
      type: 'turn',
      role: turn.role,
      turnIndex: currentTurnIndex,
      language,
      content: turnContent,
    });
  }, [currentTurnIndex, language, logRecordingEvent, recording.isRecording, transcriptTurns]);

  const displayedTurns = useMemo(() => {
    if (!transcriptTurns.length) return [];
    return transcriptTurns.slice(0, currentTurnIndex + 1);
  }, [transcriptTurns, currentTurnIndex]);

  const isAtEnd =
    !transcriptTurns.length || currentTurnIndex >= transcriptTurns.length - 1;

  const handleNextTurn = () => {
    if (isAtEnd) return;
    setCurrentTurnIndex((prev) => Math.min(prev + 1, transcriptTurns.length - 1));
  };

  const handleAutoPlayToggle = () => {
    if (isAutoPlay) {
      setIsAutoPlay(false);
      return;
    }

    if (isAtEnd) {
      setCurrentTurnIndex(0);
    }

    setIsAutoPlay(true);
  };

  const riskPalette = panelState
    ? riskTierPalette[panelState.riskTier] ?? riskTierPalette.moderate
    : riskTierPalette.low;

  const decisionMeta = panelState
    ? decisionPalette[panelState.decision] ?? decisionPalette.manage
    : decisionPalette.manage;

  const riskPercent = panelState?.riskMax
    ? Math.min(panelState.riskScore / panelState.riskMax, 1)
    : 0;

  const handleRecordingToggle = () => {
    if (recording.isRecording) {
      stopRecording({ reason: 'manual-stop' });
      return;
    }
    startRecording();
  };

  const handleAddMarker = () => {
    if (!recording.isRecording) return;
    logRecordingEvent({
      type: 'marker',
      turnIndex: currentTurnIndex,
      label: `Marker @ turn ${currentTurnIndex + 1}`,
    });
  };

  const handleAttachmentPress = (attachment) => {
    if (!attachment?.url) return;
    Linking.openURL(attachment.url).catch(() => {});
    if (recording.isRecording) {
      logRecordingEvent({
        type: 'attachment-open',
        attachmentId: attachment.id,
        label: attachment.label,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topLabel}>Kallpa PCAC</Text>
            <Text style={styles.topTitle}>Live Visit</Text>
          </View>

          <View style={styles.languageSwitch}>
            {['en', 'es'].map((code) => (
              <Pressable
                key={code}
                style={[
                  styles.languageChip,
                  language === code && styles.languageChipActive,
                ]}
                onPress={() => setLanguage(code)}
              >
                <Text
                  style={[
                    styles.languageChipText,
                    language === code && styles.languageChipTextActive,
                  ]}
                >
                  {code === 'en' ? 'EN' : 'ES'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.disclaimerPill}>
          <Text style={styles.disclaimerText}>Demo only • Not for clinical use</Text>
        </View>

        <View style={styles.dualColumn}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Conversation</Text>
              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.actionButton, isAutoPlay && styles.actionButtonActive]}
                  onPress={handleAutoPlayToggle}
                >
                  <Text
                    style={[
                      styles.actionButtonText,
                      isAutoPlay && styles.actionButtonTextActive,
                    ]}
                  >
                    {isAutoPlay ? 'Autoplaying' : 'Autoplay'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.primaryButton]}
                  onPress={handleNextTurn}
                  disabled={isAtEnd}
                >
                  <Text
                    style={[
                      styles.primaryButtonText,
                      isAtEnd && styles.disabledText,
                    ]}
                  >
                    {isAtEnd ? 'End of script' : 'Next turn'}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.transcriptArea}>
              {displayedTurns.map((turn, index) => {
                const theme = roleTheme[turn.role] ?? roleTheme.patient;
                const text = turn.localeText?.[language] ?? turn.localeText?.en;
                return (
                  <View
                    key={`${turn.role}-${index}`}
                    style={[
                      styles.bubbleWrapper,
                      theme.alignment === 'flex-end' && styles.alignEnd,
                      theme.alignment === 'center' && styles.alignCenter,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        {
                          backgroundColor: theme.bubble,
                          borderColor: theme.border,
                        },
                        theme.alignment === 'center' && styles.bubbleFull,
                      ]}
                    >
                      <Text style={styles.bubbleMeta}>{theme.label}</Text>
                      <Text style={styles.bubbleText}>{text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, styles.panelCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>PCAC Panel</Text>
              <Pressable
                style={styles.explainButton}
                onPress={() => setExplainVisible(true)}
              >
                <Text style={styles.explainButtonText}>Explain</Text>
              </Pressable>
            </View>

            <View style={styles.riskGaugeWrapper}>
              <View style={styles.riskGaugeMeta}>
                <Text style={styles.riskLabel}>Risk</Text>
                <Text style={[styles.riskTierText, { color: riskPalette.text }]}>
                  {riskPalette.label}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={riskPalette.fill}
                  style={[styles.progressFill, { width: `${riskPercent * 100}%` }]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
              </View>
              <Text style={styles.riskScoreLabel}>
                {panelState?.riskScore ?? '—'} / {panelState?.riskMax ?? '—'}
              </Text>
            </View>

            <View style={styles.decisionBadge}>
              <Text style={[styles.decisionBadgeText, { color: decisionMeta.color }]}>
                {decisionMeta.label}
              </Text>
            </View>

            <View style={styles.ordersSection}>
              <Text style={styles.ordersTitle}>Draft orders</Text>
              {(panelState?.orders ?? []).length === 0 && (
                <Text style={styles.ordersEmpty}>No active drafts for this state.</Text>
              )}
              {(panelState?.orders ?? []).map((order, index) => (
                <View key={`${order.label}-${index}`} style={styles.orderRow}>
                  <View style={styles.orderTypeBadge}>
                    <Text style={styles.orderTypeText}>{order.type?.toUpperCase() ?? 'ORD'}</Text>
                  </View>
                  <Text style={styles.orderLabel}>{order.label}</Text>
                  <Text style={styles.orderStatus}>Draft</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Controls</Text>
          <Text style={styles.controlsHint}>
            Toggle clinical modifiers to watch the PCAC panel adapt in real time.
          </Text>
          <View style={styles.chipsRow}>
            {chips.map((chip) => {
              const isActive = activeVariants.includes(chip.id);
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => {
                    toggleVariant(chip.id);
                    if (recording.isRecording) {
                      logRecordingEvent({
                        type: 'variant-toggle',
                        variantId: chip.id,
                        label: chip.label,
                        active: !isActive,
                      });
                    }
                  }}
                  style={[
                    styles.controlChip,
                    isActive && styles.controlChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.controlChipText,
                      isActive && styles.controlChipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, styles.snapshotCard]}>
          <View style={styles.snapshotHeader}>
            <View style={styles.snapshotHeaderText}>
              <Text style={styles.cardTitle}>Clinical snapshot</Text>
              <Text style={styles.snapshotMeta}>
                {clinicalHistory?.summary ?? 'No structured history captured for this path.'}
              </Text>
            </View>
            {selectedScenario?.clinicType && (
              <View style={styles.snapshotBadge}>
                <Text style={styles.snapshotBadgeText}>
                  {selectedScenario.clinicType}
                </Text>
              </View>
            )}
          </View>

          {historyEntries.length ? (
            <View style={styles.snapshotGrid}>
              {historyEntries.map((entry) => (
                <View key={entry.label} style={styles.snapshotRow}>
                  <Text style={styles.snapshotLabel}>{entry.label}</Text>
                  {entry.values.map((value, idx) => (
                    <Text key={`${entry.label}-${idx}`} style={styles.snapshotValue}>
                      {value}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.snapshotEmpty}>No additional history documented.</Text>
          )}
        </View>

        <View style={[styles.card, styles.labsCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Signals & labs</Text>
            <Text style={styles.cardMeta}>
              {labsRows.length ? `${labsRows.length} datapoints` : 'Not simulated'}
            </Text>
          </View>
          {labsRows.length ? (
            <View style={styles.labsTable}>
              {labsRows.map((lab, index) => {
                const flagKey = (lab.flag ?? '').toLowerCase();
                const flagColor = labFlagColors[flagKey] ?? '#94a3b8';
                return (
                  <View key={`${lab.name}-${index}`} style={styles.labRow}>
                    <View style={styles.labLeft}>
                      <Text style={styles.labName}>{lab.name}</Text>
                      {lab.unit ? <Text style={styles.labUnit}>{lab.unit}</Text> : null}
                    </View>
                    <View style={styles.labRight}>
                      <Text style={styles.labValue}>{lab.value}</Text>
                      {lab.flag && (
                        <Text
                          style={[styles.labFlag, { color: flagColor, borderColor: flagColor }]}
                        >
                          {lab.flag}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.snapshotEmpty}>No labs mapped to this branch.</Text>
          )}
        </View>

        {attachmentList.length > 0 && (
          <View style={[styles.card, styles.attachmentsCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Attachments</Text>
              <Text style={styles.cardMeta}>
                {attachmentList.length} asset{attachmentList.length === 1 ? '' : 's'}
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.attachmentsRow}
            >
              {attachmentList.map((attachment) => (
                <Pressable
                  key={attachment.id}
                  onPress={() => handleAttachmentPress(attachment)}
                  style={styles.attachmentCard}
                >
                  <View style={styles.attachmentThumbWrapper}>
                    <Image
                      source={{
                        uri:
                          attachment.thumbnail ??
                          attachment.url ??
                          'https://placehold.co/400x240?text=asset',
                      }}
                      style={styles.attachmentThumb}
                    />
                    <View style={styles.attachmentTypeBadge}>
                      <Text style={styles.attachmentTypeText}>
                        {attachment.type?.toUpperCase() ?? 'FILE'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.attachmentLabel}>{attachment.label}</Text>
                  <Text style={styles.attachmentCaption} numberOfLines={2}>
                    {attachment.caption ?? attachment.url}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.card, styles.recordingCard]}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Session capture</Text>
            <Text style={[styles.recordingStatus, { color: recordingStatusColor }]}>
              {recording.isRecording ? 'Recording' : 'Standby'}
            </Text>
          </View>
          <Text style={styles.recordingMeta}>
            {recording.isRecording
              ? `Capturing ${selectedScenario?.title ?? 'scenario'} in ${language.toUpperCase()}`
              : lastSessionSummary}
          </Text>
          <View style={styles.recordingActions}>
            <Pressable
              style={[
                styles.recordingButton,
                recording.isRecording
                  ? styles.recordingButtonStop
                  : styles.recordingButtonStart,
              ]}
              onPress={handleRecordingToggle}
            >
              <Text style={styles.recordingButtonText}>
                {recording.isRecording ? 'Stop capture' : 'Start capture'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.recordingButton,
                styles.markerButton,
                !recording.isRecording && styles.recordingButtonDisabled,
              ]}
              onPress={handleAddMarker}
              disabled={!recording.isRecording}
            >
              <Text style={styles.markerButtonText}>Drop marker</Text>
            </Pressable>
          </View>
          <View style={styles.timelineWrapper}>
            <Text style={styles.timelineLabel}>Live timeline</Text>
            {timelineEvents.length ? (
              timelineEvents.map((event) => (
                <View
                  key={event.id ?? `${event.type}-${event.timestamp}`}
                  style={styles.timelineRow}
                >
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineEventType}>{event.type}</Text>
                    <Text style={styles.timelineEventMeta}>
                      {(event.label ?? event.role ?? 'event').toString()} •{' '}
                      {formatRelativeTime(event.timestamp)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.timelineEmpty}>No events captured yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isExplainVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExplainVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setExplainVisible(false)}
        >
          <Pressable style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Why this decision?</Text>
            {(panelState?.reasons ?? []).map((reason, index) => (
              <View key={`${reason}-${index}`} style={styles.reasonRow}>
                <View style={styles.reasonDot} />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
            {!panelState?.reasons?.length && (
              <Text style={styles.reasonText}>No rationale available.</Text>
            )}
            <Pressable
              style={[styles.primaryButton, styles.modalButton]}
              onPress={() => setExplainVisible(false)}
            >
              <Text style={styles.primaryButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default Visit;

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#010409',
  },
  container: {
    padding: 20,
    paddingBottom: 120,
    gap: 18,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  topTitle: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: 4,
  },
  languageSwitch: {
    backgroundColor: '#020617',
    borderRadius: 999,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.5)',
    padding: 4,
    gap: 4,
  },
  languageChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  languageChipActive: {
    backgroundColor: '#f8fafc',
  },
  languageChipText: {
    color: '#94a3b8',
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  languageChipTextActive: {
    color: '#0f172a',
  },
  disclaimerPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderColor: 'rgba(248,113,113,0.35)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  disclaimerText: {
    color: '#f87171',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scenarioSection: {
    gap: 10,
  },
  sectionLabel: {
    color: '#9ca3af',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  scenarioCard: {
    width: screenWidth * 0.7,
    marginRight: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(15,118,110,0.3)',
    gap: 8,
  },
  scenarioCardActive: {
    borderColor: '#22d3ee',
    shadowColor: '#22d3ee',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  scenarioMeta: {
    color: '#67e8f9',
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  scenarioTitle: {
    color: '#e0f2fe',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  scenarioChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  scenarioChipBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scenarioChipBadgeText: {
    color: '#a5f3fc',
    fontSize: 11,
    fontWeight: '600',
  },
  dualColumn: {
    flexDirection: 'column',
    gap: 18,
  },
  card: {
    backgroundColor: '#020617',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 16,
    gap: 12,
  },
  panelCard: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(14,165,233,0.25)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(148,163,184,0.15)',
    borderColor: '#f97316',
  },
  actionButtonText: {
    color: '#cbd5f5',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonTextActive: {
    color: '#f97316',
  },
  primaryButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  primaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disabledText: {
    color: 'rgba(15,23,42,0.4)',
  },
  transcriptArea: {
    gap: 12,
  },
  bubbleWrapper: {
    width: '100%',
  },
  bubble: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    gap: 4,
    maxWidth: '90%',
  },
  bubbleFull: {
    alignSelf: 'center',
    maxWidth: '100%',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignCenter: {
    alignItems: 'center',
  },
  bubbleMeta: {
    color: '#94a3b8',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bubbleText: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 20,
  },
  explainButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  explainButtonText: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  riskGaugeWrapper: {
    gap: 8,
  },
  riskGaugeMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    color: '#94a3b8',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  riskTierText: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  riskScoreLabel: {
    color: '#e2e8f0',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  decisionBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,250,252,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  decisionBadgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ordersSection: {
    gap: 10,
  },
  ordersTitle: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  ordersEmpty: {
    color: '#cbd5f5',
    fontSize: 14,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.15)',
  },
  orderTypeBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(148,163,184,0.2)',
  },
  orderTypeText: {
    color: '#cbd5f5',
    fontSize: 11,
    fontWeight: '700',
  },
  orderLabel: {
    color: '#f8fafc',
    flex: 1,
    fontSize: 14,
  },
  orderStatus: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsHint: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  controlChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  controlChipActive: {
    borderColor: '#fb923c',
    backgroundColor: 'rgba(251,146,60,0.15)',
  },
  controlChipText: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  controlChipTextActive: {
    color: '#fb923c',
  },
  snapshotCard: {
    gap: 16,
  },
  snapshotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  snapshotHeaderText: {
    flex: 1,
    gap: 6,
  },
  snapshotMeta: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },
  snapshotBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  snapshotBadgeText: {
    color: '#38bdf8',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  snapshotGrid: {
    gap: 12,
  },
  snapshotRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 12,
    gap: 6,
    backgroundColor: '#010b16',
  },
  snapshotLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  snapshotValue: {
    color: '#f8fafc',
    fontSize: 14,
  },
  snapshotEmpty: {
    color: '#94a3b8',
    fontSize: 14,
  },
  cardMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  labsCard: {
    gap: 14,
  },
  labsTable: {
    gap: 12,
  },
  labRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 12,
  },
  labLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  labName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  labUnit: {
    color: '#94a3b8',
    fontSize: 12,
  },
  labRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  labValue: {
    color: '#f8fafc',
    fontSize: 15,
  },
  labFlag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  attachmentsCard: {
    gap: 12,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 4,
  },
  attachmentCard: {
    width: 200,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    borderRadius: 18,
    padding: 12,
    gap: 8,
    backgroundColor: '#010b16',
  },
  attachmentThumbWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    marginBottom: 4,
  },
  attachmentThumb: {
    width: '100%',
    height: 110,
  },
  attachmentTypeBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(2,6,23,0.8)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  attachmentTypeText: {
    color: '#f97316',
    fontSize: 10,
    fontWeight: '700',
  },
  attachmentLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 14,
  },
  attachmentCaption: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  recordingCard: {
    gap: 12,
    borderColor: 'rgba(248,113,113,0.2)',
  },
  recordingStatus: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recordingMeta: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  recordingActions: {
    flexDirection: 'row',
    gap: 10,
  },
  recordingButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  recordingButtonStart: {
    backgroundColor: 'rgba(34,211,238,0.1)',
    borderColor: '#22d3ee',
  },
  recordingButtonStop: {
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderColor: '#f43f5e',
  },
  recordingButtonDisabled: {
    opacity: 0.4,
  },
  recordingButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  markerButton: {
    borderColor: '#eab308',
    backgroundColor: 'rgba(234,179,8,0.1)',
  },
  markerButtonText: {
    color: '#fde68a',
    fontWeight: '700',
  },
  timelineWrapper: {
    gap: 10,
  },
  timelineLabel: {
    color: '#94a3b8',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#22d3ee',
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.15)',
    paddingBottom: 8,
  },
  timelineEventType: {
    color: '#f8fafc',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timelineEventMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  timelineEmpty: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.8)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#020617',
    borderRadius: 24,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reasonDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#fb923c',
  },
  reasonText: {
    color: '#e2e8f0',
    flex: 1,
  },
  modalButton: {
    alignSelf: 'flex-start',
  },
});
