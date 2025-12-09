// app/case/[id].jsx
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useKallpaExperience } from '../../hooks/useKallpaExperience';
import { labFlagColors } from '../../constants/kallpa';

const tierColor = {
  low: '#22d3ee',
  moderate: '#fb923c',
  high: '#f97316',
  critical: '#f43f5e',
};

const CaseDetail = () => {
  const params = useLocalSearchParams();
  const caseIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const {
    scenarios,
    selectScenario,
    selectedScenarioId,
    presetVariantsForNextScenario,
    forceVariants,
  } = useKallpaExperience();

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === caseIdParam),
    [scenarios, caseIdParam]
  );

  if (!scenario) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Case not found</Text>
          <Text style={styles.emptySubtitle}>
            The selected case is no longer available. Return to the Case Studio and try again.
          </Text>
          <Pressable style={styles.openButton} onPress={() => router.back()}>
            <Text style={styles.openButtonText}>Back to cases</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const basePanel = scenario.panels?.base ?? null;
  const riskColor = tierColor[basePanel?.riskTier] ?? '#22d3ee';
  const clinicalHistory = scenario.clinicalHistory ?? null;
  const clinicalSections = clinicalHistory
    ? [
        { label: 'Summary', items: clinicalHistory.summary ? [clinicalHistory.summary] : [] },
        { label: 'Past medical', items: clinicalHistory.pastMedical },
        { label: 'Medications', items: clinicalHistory.medications },
        { label: 'Allergies', items: clinicalHistory.allergies },
        { label: 'Social', items: clinicalHistory.social },
        { label: 'Notes', items: clinicalHistory.notes ? [clinicalHistory.notes] : [] },
      ].filter((section) => Array.isArray(section.items) && section.items.length)
    : [];
  const baselineLabs = scenario.labs?.baseline ?? [];
  const attachments = scenario.attachments ?? [];

  const handleAttachmentOpen = (attachment) => {
    if (!attachment?.url) return;
    Linking.openURL(attachment.url).catch(() => {});
  };

  const launchVisit = (variantIds = [], languageOverride) => {
    const isCurrentScenario = selectedScenarioId === scenario.id;
    if (isCurrentScenario) {
      forceVariants(variantIds);
    } else {
      presetVariantsForNextScenario(variantIds);
      selectScenario(scenario.id, {
        language: languageOverride ?? scenario.language,
        preserveVariants: true,
      });
    }
    router.push('/(tabs)/visit');
  };

  const handleOpenVisit = () => launchVisit([], scenario.language);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.suptitle}>Kallpa PCAC Case Library</Text>
        <Text style={styles.title}>{scenario.title}</Text>
        <Text style={styles.subtitle}>{scenario.clinicType}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>{scenario.symptomCluster}</Text>
          </View>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>Lang: {scenario.language.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.panelCard}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelLabel}>PCAC summary</Text>
            <View style={[styles.decisionBadge, { borderColor: riskColor }] }>
              <Text style={[styles.decisionBadgeText, { color: riskColor }]}>
                {basePanel?.decision?.toUpperCase() ?? '—'}
              </Text>
            </View>
          </View>
          <View style={styles.panelStatsRow}>
            <View>
              <Text style={styles.panelMetricLabel}>Risk score</Text>
              <Text style={[styles.panelMetricValue, { color: riskColor }]}>
                {basePanel?.riskScore ?? '—'} / {basePanel?.riskMax ?? '—'}
              </Text>
            </View>
            <View>
              <Text style={styles.panelMetricLabel}>Tier</Text>
              <Text style={[styles.panelMetricValue, { color: riskColor }]}>
                {basePanel?.riskTier ?? '—'}
              </Text>
            </View>
          </View>

          <Text style={styles.ordersHeading}>Draft orders</Text>
          {(basePanel?.orders ?? []).length === 0 && (
            <Text style={styles.ordersEmpty}>No draft orders for the baseline state.</Text>
          )}
          {(basePanel?.orders ?? []).map((order) => (
            <View key={order.label} style={styles.orderRow}>
              <View style={styles.orderTypeBadge}>
                <Text style={styles.orderTypeText}>{order.type?.toUpperCase() ?? 'ORD'}</Text>
              </View>
              <Text style={styles.orderLabel}>{order.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>History of present illness</Text>
          <Text style={styles.cardBody}>{scenario.detail?.hpi}</Text>
        </View>

        {clinicalSections.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Clinical history</Text>
            {clinicalSections.map((section) => (
              <View key={section.label} style={styles.historyBlock}>
                <Text style={styles.historyBlockLabel}>{section.label}</Text>
                {section.items.map((item, index) => (
                  <Text key={`${section.label}-${index}`} style={styles.historyBlockValue}>
                    {item}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {baselineLabs.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Signals & labs</Text>
            {baselineLabs.map((lab, index) => {
              const flagKey = (lab.flag ?? '').toLowerCase();
              const flagColor = labFlagColors[flagKey] ?? '#94a3b8';
              return (
                <View key={`${lab.name}-${index}`} style={styles.labRow}>
                  <View>
                    <Text style={styles.labName}>{lab.name}</Text>
                    {lab.unit ? <Text style={styles.labUnit}>{lab.unit}</Text> : null}
                  </View>
                  <View style={styles.labValueGroup}>
                    <Text style={styles.labValue}>{lab.value}</Text>
                    {lab.flag && (
                      <Text style={[styles.labFlag, { color: flagColor, borderColor: flagColor }]}>
                        {lab.flag}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
            <Text style={styles.labHint}>Variant toggles in Live Visit dynamically extend this table.</Text>
          </View>
        ) : null}

        {scenario.detail?.whyEscalate?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Why escalate / abstain</Text>
            {scenario.detail.whyEscalate.map((reason) => (
              <View key={reason} style={styles.reasonRow}>
                <View style={styles.reasonDot} />
                <Text style={styles.reasonText}>{reason}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {scenario.detail?.learningPoints?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Learning points</Text>
            {scenario.detail.learningPoints.map((point) => (
              <View key={point} style={styles.reasonRow}>
                <View style={styles.learningDot} />
                <Text style={styles.reasonText}>{point}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {scenario.chips?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Scenario modifiers</Text>
            <View style={styles.chipsWrap}>
              {scenario.chips.map((chip) => (
                <View key={chip.id} style={styles.chip}>
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                  <Text style={styles.chipDescription}>{chip.description}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {scenario.detail?.playbooks?.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Guided playbooks</Text>
            <Text style={styles.playbookIntro}>
              Load curated variant combos directly in the Live Visit to demo how PCAC responds.
            </Text>
            {scenario.detail.playbooks.map((play) => (
              <View key={play.id} style={styles.playbookRow}>
                <View style={styles.playbookText}>
                  <Text style={styles.playbookTitle}>{play.title}</Text>
                  <Text style={styles.playbookSummary}>{play.summary}</Text>
                  <Text style={styles.playbookOutcome}>{play.outcome}</Text>
                </View>
                <Pressable
                  style={styles.playbookButton}
                  onPress={() => launchVisit(play.variantIds ?? [], scenario.language)}
                >
                  <Text style={styles.playbookButtonText}>Load in Visit</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {attachments.length ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Attachments</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.detailAttachmentsRow}
            >
              {attachments.map((attachment) => (
                <Pressable
                  key={attachment.id}
                  style={styles.detailAttachmentCard}
                  onPress={() => handleAttachmentOpen(attachment)}
                >
                  <Image
                    source={{
                      uri:
                        attachment.thumbnail ??
                        attachment.url ??
                        'https://placehold.co/220x140?text=asset',
                    }}
                    style={styles.detailAttachmentImage}
                  />
                  <Text style={styles.detailAttachmentLabel} numberOfLines={1}>
                    {attachment.label}
                  </Text>
                  {attachment.caption ? (
                    <Text style={styles.detailAttachmentCaption} numberOfLines={2}>
                      {attachment.caption}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Back to cases</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleOpenVisit}>
            <Text style={styles.primaryText}>Open in Live Visit</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CaseDetail;

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
  suptitle: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  subtitle: {
    color: '#cbd5f5',
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  metaBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  metaBadgeText: {
    color: '#a5f3fc',
    fontWeight: '600',
  },
  panelCard: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.35)',
    padding: 16,
    gap: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelLabel: {
    color: '#94a3b8',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  decisionBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  decisionBadgeText: {
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  panelStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  panelMetricLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  panelMetricValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  ordersHeading: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  ordersEmpty: {
    color: '#cbd5f5',
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
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
    fontSize: 14,
  },
  card: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    color: '#94a3b8',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 13,
  },
  cardBody: {
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 20,
  },
  historyBlock: {
    gap: 4,
    marginTop: 6,
  },
  historyBlockLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  historyBlockValue: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
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
  learningDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#22d3ee',
  },
  chipsWrap: {
    gap: 12,
  },
  chip: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(30,64,175,0.2)',
    gap: 4,
  },
  chipLabel: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  chipDescription: {
    color: '#94a3b8',
    fontSize: 13,
  },
  playbookIntro: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  playbookRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(30,64,175,0.2)',
  },
  playbookText: {
    flex: 1,
    gap: 4,
  },
  playbookTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 15,
  },
  playbookSummary: {
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  playbookOutcome: {
    color: '#22d3ee',
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  playbookButton: {
    alignSelf: 'center',
    borderRadius: 14,
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  playbookButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  labRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.15)',
    paddingVertical: 10,
  },
  labName: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  labUnit: {
    color: '#94a3b8',
    fontSize: 12,
  },
  labValueGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labValue: {
    color: '#e0f2fe',
    fontWeight: '700',
  },
  labFlag: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  labHint: {
    marginTop: 8,
    color: '#94a3b8',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#f97316',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryText: {
    color: '#cbd5f5',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '800',
  },
  emptySubtitle: {
    color: '#94a3b8',
    textAlign: 'center',
  },
  openButton: {
    borderRadius: 16,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  openButtonText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  detailAttachmentsRow: {
    gap: 12,
  },
  detailAttachmentCard: {
    width: 180,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    backgroundColor: '#010a1c',
    overflow: 'hidden',
  },
  detailAttachmentImage: {
    width: '100%',
    height: 110,
  },
  detailAttachmentLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  detailAttachmentCaption: {
    color: '#94a3b8',
    fontSize: 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});
