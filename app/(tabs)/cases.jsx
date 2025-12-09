// app/(tabs)/cases.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Share,
  Linking,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useKallpaExperience } from '../../hooks/useKallpaExperience';
import {
  labFlagColors,
  formatDuration,
  formatRelativeTime,
} from '../../constants/kallpa';
import {
  uploadKallpaAsset,
  saveKallpaSession,
  createManualKallpaCase,
  getRecentManualCases,
  deleteManualKallpaCase,
  updateManualKallpaCase,
} from '../../lib/appwrite';
import { transcribeAudioRecording } from '../../lib/transcription';
import useAppwrite from '../../hooks/useAppwrite';

const Cases = () => {
  const router = useRouter();
  const isWebPlatform = Platform.OS === 'web';
  const {
    scenarios,
    selectScenario,
    selectedScenarioId,
    presetVariantsForNextScenario,
    forceVariants,
    sessionHistory,
  recording,
    removeSession,
    renameSession,
  } = useKallpaExperience();

  const symptomClusters = useMemo(() => {
    const unique = Array.from(new Set(scenarios.map((s) => s.symptomCluster)));
    return ['All', ...unique];
  }, [scenarios]);

  const riskOutcomes = useMemo(() => {
    const unique = Array.from(
      new Set(
        scenarios.map((s) => s.heroStats?.decisionLabel ?? 'Outcome unknown')
      )
    );
    return ['All', ...unique];
  }, [scenarios]);

  const [symptomFilter, setSymptomFilter] = useState('All');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [manualTitle, setManualTitle] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualAttachments, setManualAttachments] = useState([]);
  const [sessionLabelDraft, setSessionLabelDraft] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isSavingCase, setIsSavingCase] = useState(false);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isSharingSession, setIsSharingSession] = useState(false);
  const [prerecordedTranscript, setPrerecordedTranscript] = useState('');
  const [importedTranscriptEvents, setImportedTranscriptEvents] = useState([]);
  const [isTranscriptProcessing, setIsTranscriptProcessing] = useState(false);
  const [isTranscriptDirty, setIsTranscriptDirty] = useState(false);
  const recordingStatusRef = useRef(recording?.isRecording);
  const recordingNameInputRef = useRef(null);
  const audioRecordingRef = useRef(null);
  const audioTimerRef = useRef(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [audioRecordingDuration, setAudioRecordingDuration] = useState(0);
  const [isAudioTranscribing, setIsAudioTranscribing] = useState(false);
  const [audioStatusMessage, setAudioStatusMessage] = useState('Mic idle');
  const [lastAudioTranscriptPreview, setLastAudioTranscriptPreview] = useState('');
  const [deletingCaseId, setDeletingCaseId] = useState(null);
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [editCaseTitle, setEditCaseTitle] = useState('');
  const [editCaseNotes, setEditCaseNotes] = useState('');
  const [editCaseTranscript, setEditCaseTranscript] = useState('');
  const [savingEditedCaseId, setSavingEditedCaseId] = useState(null);

  const hasPrerecordedTranscript = prerecordedTranscript.trim().length > 0;

  useEffect(() => {
    let isMounted = true;
    const requestPermission = async () => {
      if (Platform.OS === 'web') {
        if (isMounted) {
          setHasAudioPermission(false);
          setAudioStatusMessage('Audio capture requires iOS or Android');
        }
        return;
      }
      try {
        const existing = await Audio.getPermissionsAsync();
        if (existing.status === 'granted') {
          if (isMounted) {
            setHasAudioPermission(true);
            setAudioStatusMessage('Mic idle');
          }
          return;
        }
        const response = await Audio.requestPermissionsAsync();
        if (isMounted) {
          const granted = response.status === 'granted';
          setHasAudioPermission(granted);
          setAudioStatusMessage(granted ? 'Mic idle' : 'Microphone blocked');
        }
      } catch (error) {
        console.log('requestPermission error', error);
        if (isMounted) {
          setHasAudioPermission(false);
          setAudioStatusMessage('Microphone blocked');
        }
      }
    };
    requestPermission();

    return () => {
      isMounted = false;
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      if (audioRecordingRef.current) {
        audioRecordingRef.current.stopAndUnloadAsync().catch(() => {});
        audioRecordingRef.current = null;
      }
    };
  }, []);

  // Fetch saved clinical cases from database
  const { data: savedCases, isLoading: isLoadingSavedCases, refetch: refetchSavedCases } = useAppwrite(getRecentManualCases);
  
  // Debug logging to see what we're getting
  React.useEffect(() => {
    console.log('📋 SAVED CASES DATA:', {
      count: savedCases?.length || 0,
      isLoading: isLoadingSavedCases,
      cases: savedCases?.map(c => ({
        id: c.id,
        title: c.title,
        eventCount: c.metadata?.events?.length || 0
      }))
    });
  }, [savedCases, isLoadingSavedCases]);

  const triggerHaptic = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  useEffect(() => {
    if (!selectedSessionId && sessionHistory?.length) {
      setSelectedSessionId(sessionHistory[0].id);
    }
  }, [sessionHistory, selectedSessionId]);

  useEffect(() => {
    const wasRecording = recordingStatusRef.current;
    const isRecordingNow = recording?.isRecording;
    if (wasRecording && !isRecordingNow && sessionHistory?.length) {
      setSelectedSessionId(sessionHistory[0].id);
      setTimeout(() => {
        recordingNameInputRef.current?.focus?.();
      }, 150);
    }
    recordingStatusRef.current = isRecordingNow;
  }, [recording?.isRecording, sessionHistory]);

  useEffect(() => {
    if (!hasPrerecordedTranscript) {
      setImportedTranscriptEvents([]);
      setIsTranscriptDirty(false);
    }
  }, [hasPrerecordedTranscript]);

  const recentSessions = useMemo(
    () => (Array.isArray(sessionHistory) ? sessionHistory.slice(0, 3) : []),
    [sessionHistory]
  );

  const selectedSession = useMemo(() => {
    if (!Array.isArray(sessionHistory) || !sessionHistory.length) return null;
    if (!selectedSessionId) return sessionHistory[0];
    return sessionHistory.find((session) => session.id === selectedSessionId) ??
      sessionHistory[0];
  }, [sessionHistory, selectedSessionId]);
  
  useEffect(() => {
    setSessionLabelDraft(selectedSession?.customTitle ?? '');
  }, [selectedSession?.customTitle, selectedSession?.id]);

  const selectedSessionScenario = useMemo(() => {
    if (!selectedSession) return null;
    return scenarios.find((scenario) => scenario.id === selectedSession.scenarioId) ?? null;
  }, [scenarios, selectedSession]);

  function formatSessionClock(timestamp) {
    if (!timestamp) return 'recent';
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return formatRelativeTime(timestamp ?? Date.now());
    }
  }

  const selectedSessionClock = selectedSession
    ? formatSessionClock(selectedSession.startedAt)
    : null;
  const manualSessionTitle = selectedSession?.customTitle?.trim() || null;
  const manualTitlePlaceholder = manualSessionTitle
    ? `Manual capture – ${manualSessionTitle}${
        selectedSessionClock ? ` (${selectedSessionClock})` : ''
      }`
    : 'Manual capture – Name this recording';
  const normalizedSessionLabel = sessionLabelDraft.trim();
  const sessionLabelHasChanges = selectedSession
    ? normalizedSessionLabel !== (selectedSession.customTitle?.trim() ?? '')
    : false;

  const filteredCases = useMemo(() =>
    scenarios.filter((scenario) => {
      const matchesSymptom =
        symptomFilter === 'All' || scenario.symptomCluster === symptomFilter;
      const matchesOutcome =
        outcomeFilter === 'All' ||
        (scenario.heroStats?.decisionLabel ?? 'Outcome unknown') ===
          outcomeFilter;
      return matchesSymptom && matchesOutcome;
    }),
  [scenarios, symptomFilter, outcomeFilter]);

  const goToCaseDetail = (scenarioId) => {
    router.push(`/case/${scenarioId}`);
  };

  const deleteSavedCasePermanently = async (caseId) => {
    if (!caseId || deletingCaseId) return;
    try {
      triggerHaptic();
      setDeletingCaseId(caseId);
      await deleteManualKallpaCase(caseId);
      if (typeof refetchSavedCases === 'function') {
        await refetchSavedCases();
      }
    } catch (error) {
      console.log('deleteSavedCasePermanently error', error);
      Alert.alert(
        'Delete failed',
        error?.message ?? 'We could not remove that case. Please try again.'
      );
    } finally {
      setDeletingCaseId(null);
    }
  };

  const confirmDeleteSavedCase = (caseRecord) => {
    if (!caseRecord?.id) return;
    triggerHaptic();
    Alert.alert(
      'Delete this saved case?',
      'This permanently removes the transcript and attachments for this case.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete case',
          style: 'destructive',
          onPress: () => deleteSavedCasePermanently(caseRecord.id),
        },
      ]
    );
  };

  const beginEditingCase = (caseRecord) => {
    if (!caseRecord?.id) return;
    triggerHaptic();
    setEditingCaseId(caseRecord.id);
    setEditCaseTitle(caseRecord.title ?? '');
    setEditCaseNotes(caseRecord.notes ?? '');
    const transcriptEvents = caseRecord.metadata?.events ?? [];
    const transcriptText = transcriptEvents
      .map((event) => event?.content?.trim())
      .filter(Boolean)
      .join('\n');
    setEditCaseTranscript(transcriptText);
  };

  const cancelEditingCase = () => {
    setEditingCaseId(null);
    setEditCaseTitle('');
    setEditCaseNotes('');
    setEditCaseTranscript('');
  };

  const saveEditedCase = async () => {
    if (!editingCaseId) return;
    const trimmedTitle = editCaseTitle?.trim();
    if (!trimmedTitle) {
      Alert.alert('Case title required', 'Add a title before saving changes.');
      return;
    }
    try {
      triggerHaptic();
      setSavingEditedCaseId(editingCaseId);
      const trimmedNotes = editCaseNotes?.trim() || null;
      const trimmedTranscript = editCaseTranscript?.trim();
      const transcriptEvents = trimmedTranscript
        ? buildTranscriptEventsFromText(trimmedTranscript)
        : [];

      await updateManualKallpaCase(editingCaseId, {
        title: trimmedTitle,
        notes: trimmedNotes,
        transcript: transcriptEvents,
      });

      cancelEditingCase();
      if (typeof refetchSavedCases === 'function') {
        await refetchSavedCases();
      }
      Alert.alert('Case updated', 'Your saved case was updated successfully.');
    } catch (error) {
      console.log('saveEditedCase error', error);
      Alert.alert(
        'Update failed',
        error?.message ?? 'Unable to update this case. Please try again.'
      );
    } finally {
      setSavingEditedCaseId(null);
    }
  };

  const openScenarioInVisit = (scenario) => {
    if (!scenario) return;
    const isCurrent = selectedScenarioId === scenario.id;
    if (isCurrent) {
      forceVariants([]);
    } else {
      presetVariantsForNextScenario([]);
      selectScenario(scenario.id, {
        language: scenario.language,
        preserveVariants: true,
      });
    }
    router.push('/(tabs)/visit');
  };

  const buildSessionChipTitle = (session, scenarioMeta) => {
    const friendlyTitle = session.customTitle?.trim();
    const baseTitle = friendlyTitle?.length
      ? friendlyTitle
      : 'Name this recording';
    const clock = formatSessionClock(session.startedAt);
    // Only show elapsed time - remove scenario name
    return `${baseTitle} • ${clock}`;
  };

  const buildTranscriptEventsFromText = (text) => {
    const trimmed = text ?? '';
    const baseTimestamp = Date.now();
    return trimmed
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `imported-${baseTimestamp}-${index}`,
        timestamp: baseTimestamp + index * 1000,
        type: 'transcript-import',
        role: 'speaker',
        content: line,
      }));
  };

  const ensureTranscriptEvents = () => {
    if (!hasPrerecordedTranscript) return [];
    if (importedTranscriptEvents.length && !isTranscriptDirty) {
      return importedTranscriptEvents;
    }
    const synthesized = buildTranscriptEventsFromText(prerecordedTranscript);
    setImportedTranscriptEvents(synthesized);
    setIsTranscriptDirty(false);
    return synthesized;
  };

  const getTimelineWithImports = (sessionEvents = []) => {
    const events = Array.isArray(sessionEvents) ? [...sessionEvents] : [];
    const transcriptEvents = ensureTranscriptEvents();
    if (transcriptEvents.length) {
      events.push(...transcriptEvents);
    }
    return events;
  };

  const buildManualSessionFallback = () => {
    const fallbackScenario = selectedSessionScenario ?? scenarios[0] ?? null;
    const transcriptEvents = ensureTranscriptEvents();
    const durationFromTranscript = transcriptEvents.length * 1000;
    return {
      id: `manual-${Date.now()}`,
      scenarioId: fallbackScenario?.id ?? 'manual',
      language: fallbackScenario?.language ?? 'en',
      durationMs: durationFromTranscript || 60000,
      events: transcriptEvents,
      variantSequence: [],
      finalDecision: fallbackScenario?.heroStats?.decisionLabel ?? 'Manual note',
    };
  };

  const sessionTimelinePreview = useMemo(() => {
    if (!selectedSession?.events?.length) return [];
    return [...selectedSession.events].reverse();
  }, [selectedSession]);

  const sessionTranscriptLines = useMemo(() => {
    if (!selectedSession?.events?.length) return [];
    return selectedSession.events
      .filter((event) => typeof event.content === 'string' && event.content.trim().length)
      .map((event) => ({
        id: event.id,
        role: event.role ?? event.type ?? 'event',
        content: event.content.trim(),
        timestamp: event.timestamp,
      }))
      .reverse();
  }, [selectedSession]);

  const startAudioRecording = async () => {
    triggerHaptic();
    if (isAudioRecording || isAudioTranscribing) return;
    if (isWebPlatform) {
      Alert.alert(
        'Unsupported platform',
        'Realtime audio capture only works on iOS or Android builds. Use Expo Go on a physical device to try it.'
      );
      setAudioStatusMessage('Use Expo Go on a device to record audio');
      return;
    }
    try {
      setAudioStatusMessage('Checking microphone…');
      let permissionGranted = hasAudioPermission;
      if (!permissionGranted) {
        const { status } = await Audio.requestPermissionsAsync();
        permissionGranted = status === 'granted';
        setHasAudioPermission(permissionGranted);
      }
      if (!permissionGranted) {
        setAudioStatusMessage('Microphone blocked');
        Alert.alert(
          'Microphone permission needed',
          'Enable microphone access in Settings to capture audio clips.'
        );
        return;
      }

      if (audioRecordingRef.current) {
        try {
          await audioRecordingRef.current.stopAndUnloadAsync();
        } catch (cleanupError) {
          console.log('audio cleanup before start', cleanupError);
        }
        audioRecordingRef.current = null;
      }

      const audioModeConfig = {
        staysActiveInBackground: false,
        shouldDuckAndroid: Platform.OS === 'android',
      };

      if (Platform.OS === 'ios') {
        Object.assign(audioModeConfig, {
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        });
      }

      await Audio.setAudioModeAsync(audioModeConfig);

      const { recording: freshRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      audioRecordingRef.current = freshRecording;
      setIsAudioRecording(true);
      setAudioRecordingDuration(0);
      setAudioStatusMessage('Recording…');
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
      }
      audioTimerRef.current = setInterval(() => {
        setAudioRecordingDuration((prev) => prev + 1000);
      }, 1000);
    } catch (error) {
      console.log('startAudioRecording error', error);
      const friendlyMessage = error?.message
        ? `Recording failed: ${error.message}`
        : 'Recording failed';
      setAudioStatusMessage(friendlyMessage);
      Alert.alert('Unable to start audio recording', error?.message ?? 'Unknown error occurred.');
      if (audioRecordingRef.current) {
        audioRecordingRef.current.stopAndUnloadAsync().catch(() => {});
        audioRecordingRef.current = null;
      }
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      setIsAudioRecording(false);
    }
  };

  const stopAudioRecording = async () => {
    triggerHaptic();
    if (!isAudioRecording || !audioRecordingRef.current) {
      return;
    }
    try {
      setAudioStatusMessage('Wrapping up audio…');
      await audioRecordingRef.current.stopAndUnloadAsync();
      const status = await audioRecordingRef.current.getStatusAsync();
      const uri = audioRecordingRef.current.getURI();
      const postRecordingAudioMode = Platform.select({
        ios: { allowsRecordingIOS: false },
        default: {},
      });
      await Audio.setAudioModeAsync(postRecordingAudioMode);
      const durationMs = status.durationMillis ?? audioRecordingDuration;
      audioRecordingRef.current = null;
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      setIsAudioRecording(false);
      setAudioRecordingDuration(0);
      if (!uri) {
        setAudioStatusMessage('No audio file generated');
        Alert.alert('Audio missing', 'We could not locate the recorded audio file.');
        return;
      }

      setIsAudioTranscribing(true);
      setAudioStatusMessage('Transcribing with Whisper…');
      const transcriptResult = await transcribeAudioRecording({
        uri,
        mimeType: 'audio/m4a',
        fileName: `visit-audio-${Date.now()}.m4a`,
        durationMs,
      });

      const transcriptText =
        typeof transcriptResult === 'string' ? transcriptResult : transcriptResult?.text;
      const cleanedText = transcriptText?.trim();
      if (!cleanedText) {
        setAudioStatusMessage('Transcription returned no text');
        Alert.alert(
          'Empty transcript',
          'The transcription service returned no text. Try recording a louder clip.'
        );
        return;
      }

      setPrerecordedTranscript((prev) => {
        const merged = prev ? `${prev}\n\n${cleanedText}` : cleanedText;
        const events = buildTranscriptEventsFromText(merged);
        setImportedTranscriptEvents(events);
        setIsTranscriptDirty(false);
        const preview = cleanedText.split('\n').slice(0, 6).join('\n');
        setLastAudioTranscriptPreview(preview);
        return merged;
      });
      setAudioStatusMessage('Transcript synced');
      Alert.alert('Audio transcribed', 'The clip has been merged into your manual transcript.');
    } catch (error) {
      console.log('stopAudioRecording error', error);
      console.log('stopAudioRecording error', error);
      setAudioStatusMessage('Audio capture failed');
      Alert.alert('Unable to stop recording', error.message ?? 'Unknown error occurred.');
    } finally {
      setIsAudioTranscribing(false);
    }
  };

  const handleTranscriptConvert = async () => {
    triggerHaptic();
    if (!hasPrerecordedTranscript) {
      Alert.alert('Nothing to convert', 'Paste a transcript section first.');
      return;
    }
    try {
      setIsTranscriptProcessing(true);
      ensureTranscriptEvents();
    } catch (error) {
      console.log('handleTranscriptConvert error', error);
      Alert.alert('Conversion failed', error.message ?? 'Unable to convert transcript.');
    } finally {
      setIsTranscriptProcessing(false);
    }
  };

  const handleImportTranscriptFile = async () => {
    triggerHaptic();
    try {
      setIsTranscriptProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = Array.isArray(result.assets) ? result.assets[0] : result;
      if (!asset?.uri) return;
      const mimeType = asset.mimeType ?? 'application/octet-stream';
      const lowerName = asset.name?.toLowerCase?.() ?? '';
      const isTextMime = ['text/', 'application/json', 'application/xml'].some((allowed) =>
        allowed.endsWith('/') ? mimeType.startsWith(allowed) : mimeType === allowed
      );
      const textExtensions = ['.txt', '.md', '.markdown', '.json', '.srt', '.vtt'];
      const hasTextExtension = textExtensions.some((ext) => lowerName.endsWith(ext));
      const audioExtensions = ['.m4a', '.mp3', '.aac', '.wav', '.flac', '.ogg', '.oga', '.caf'];
      const isAudioAsset =
        mimeType.startsWith('audio/') || audioExtensions.some((ext) => lowerName.endsWith(ext));

      if (isAudioAsset) {
        try {
          console.log('🎤 Transcribing audio with high-accuracy Whisper-1 model...');
          const transcriptResult = await transcribeAudioRecording({
            uri: asset.uri,
            mimeType,
            fileName: asset.name ?? `audio-${Date.now()}`,
          });
          
          // Handle both old format (string) and new format (object with text/segments)
          const transcriptText = typeof transcriptResult === 'string' 
            ? transcriptResult 
            : transcriptResult.text;
          
          const cleanedText = transcriptText?.trim() || '';
          
          if (!cleanedText.length) {
            Alert.alert('No transcript returned', 'The transcription service did not return any text.');
            return;
          }
          
          const events = buildTranscriptEventsFromText(cleanedText);
          setPrerecordedTranscript(cleanedText);
          setImportedTranscriptEvents(events);
          setIsTranscriptDirty(false);
          
          // Show accuracy info
          const duration = transcriptResult.duration || 0;
          const segments = transcriptResult.segments?.length || 0;
          
          console.log(`✅ Transcribed ${cleanedText.length} characters in ${duration.toFixed(1)}s`);
          
          Alert.alert(
            '✅ Audio Transcribed!',
            `High-accuracy Whisper-1 AI extracted ${events.length} lines from your recording.\n\nDuration: ${duration.toFixed(1)}s\nSegments: ${segments}\n\nScroll down to see the full transcript!`
          );
        } catch (transcriptionError) {
          console.log('❌ Audio transcription error:', transcriptionError);
          Alert.alert(
            'Transcription failed',
            `Error: ${transcriptionError.message}\n\nTroubleshooting:\n• Check your OpenAI API key in .env.local\n• Ensure audio file is valid\n• Check internet connection`
          );
        }
        return;
      }

      if (!isTextMime && !hasTextExtension) {
        Alert.alert(
          'Unsupported file type',
          'Please upload a .txt/.md transcript export (e.g., from Otter) or provide an audio file for automatic transcription.'
        );
        return;
      }
      
      const content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (!content?.trim().length) {
        Alert.alert('Empty file', 'The file contains no text.');
        return;
      }

      const cleanedContent = content.trim();
      setPrerecordedTranscript((prev) => {
        const merged = prev ? `${prev}\n\n${cleanedContent}` : cleanedContent;
        const events = buildTranscriptEventsFromText(merged);
        setImportedTranscriptEvents(events);
        setIsTranscriptDirty(false);
        const lineCount = merged.split('\n').filter(line => line.trim().length > 0).length;
        Alert.alert('Transcript imported', `Successfully loaded ${lineCount} lines from ${asset.name ?? 'file'}.`);
        return merged;
      });
    } catch (error) {
      console.log('handleImportTranscriptFile error', error);
      Alert.alert('Import failed', error.message ?? 'Unable to import transcript file.');
    } finally {
      setIsTranscriptProcessing(false);
    }
  };

  const handleClearTranscript = () => {
    triggerHaptic();
    setPrerecordedTranscript('');
    setImportedTranscriptEvents([]);
    setIsTranscriptDirty(false);
    setLastAudioTranscriptPreview('');
  };

  const handleUseRecordingTranscript = () => {
    triggerHaptic();
    if (!selectedSession?.events?.length) {
  Alert.alert('No transcript available', 'Capture audio or import a transcript first.');
      return;
    }
    const transcriptLines = selectedSession.events
      .filter((event) => typeof event.content === 'string' && event.content.trim().length)
      .map((event) => event.content.trim());
    if (!transcriptLines.length) {
      Alert.alert('No transcript text', 'This recording does not include transcript content.');
      return;
    }
    const merged = transcriptLines.join('\n');
    setPrerecordedTranscript(merged);
    setImportedTranscriptEvents(selectedSession.events);
    setIsTranscriptDirty(false);
    Alert.alert('Transcript ready', 'We copied the recording script into the text box.');
  };

  const handleUploadAttachment = async () => {
    triggerHaptic();
    let optimisticId = null;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;
      const asset = Array.isArray(result.assets) ? result.assets[0] : result;
      if (!asset?.uri) return;

      const contentType = asset.mimeType ?? 'application/octet-stream';
      const previewUri = contentType.startsWith('image/') ? asset.uri : null;
      optimisticId = `pending-${Date.now()}`;
      setManualAttachments((prev) => [
        ...prev,
        {
          id: optimisticId,
          label: asset.name ?? `attachment-${Date.now()}`,
          mimeType: contentType,
          previewUri,
          isPending: true,
        },
      ]);
      setIsUploadingAsset(true);
      const uploaded = await uploadKallpaAsset({
        uri: asset.uri,
        fileName: asset.name ?? `attachment-${Date.now()}`,
        contentType,
        sourceSessionId: selectedSession?.id ?? 'manual-only',
      });

      setManualAttachments((prev) =>
        prev.map((item) =>
          item.id === optimisticId
            ? {
                ...uploaded,
                mimeType: uploaded.mimeType ?? contentType,
                previewUri,
                isPending: false,
              }
            : item
        )
      );
      Alert.alert('Attachment ready', `${asset.name ?? 'File'} added to this case capture.`);
    } catch (error) {
      console.log('handleUploadAttachment error', error);
      if (optimisticId) {
        setManualAttachments((prev) => prev.filter((item) => item.id !== optimisticId));
      }
      Alert.alert('Upload failed', error.message ?? 'Unable to upload attachment.');
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleSaveSessionLabel = async () => {
    triggerHaptic();
    if (!selectedSession) return;
    
    // Just rename the session locally (not saving to database)
    renameSession(selectedSession.id, normalizedSessionLabel);
    Alert.alert('Label saved', 'Session renamed. Use "Save manual case" button to save to database.');
  };

  const handleRemoveAttachment = (attachmentId) => {
    triggerHaptic();
    setManualAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const handlePreviewAttachment = (attachment) => {
    triggerHaptic();
    const uri = attachment?.previewUri ?? attachment?.url ?? attachment?.path ?? null;
    if (!uri) {
      Alert.alert('No preview available', 'This attachment cannot be opened on device.');
      return;
    }
    Linking.openURL(uri).catch(() =>
      Alert.alert('Unable to open', 'This file type is not supported on your device yet.')
    );
  };

  const handleDeleteSession = (sessionId) => {
    triggerHaptic();
    const remaining = sessionHistory.filter((item) => item.id !== sessionId);
    removeSession(sessionId);
    setSelectedSessionId((prev) => {
      if (prev === sessionId) {
        return remaining[0]?.id ?? null;
      }
      return prev;
    });
    Alert.alert('Recording removed', 'The capture was deleted from your local timeline.');
  };

  const handleSaveManualCase = async () => {
    triggerHaptic();
    const baseSession =
      selectedSession ?? (hasPrerecordedTranscript ? buildManualSessionFallback() : null);

    if (!baseSession) {
  Alert.alert('No session data', 'Capture audio or attach a transcript first.');
      return;
    }

    const scenarioMeta =
      scenarios.find((scenario) => scenario.id === baseSession.scenarioId) ??
      selectedSessionScenario ??
      scenarios[0] ??
      null;
    const title = manualTitle.trim() || manualTitlePlaceholder;
    const timeline = getTimelineWithImports(baseSession.events ?? []);
    const metadata = {
      duration_ms: baseSession.durationMs,
      risk_score: baseSession.riskScore ?? scenarioMeta?.heroStats?.riskScore,
      decision: baseSession.finalDecision ?? scenarioMeta?.heroStats?.decisionLabel,
      variant_sequence: baseSession.variantSequence,
      transcript_event_count: timeline.length,
      has_transcript: Boolean(hasPrerecordedTranscript),
      events: timeline,
    };

    try {
      setIsSavingCase(true);
      const sessionPayload = {
        scenario_id: baseSession.scenarioId,
        language: baseSession.language,
        duration_ms: baseSession.durationMs,
        events: timeline,
        metadata,
      };
      let persistedSessionId = baseSession.id;
      try {
        const savedSession = await saveKallpaSession(sessionPayload);
        persistedSessionId = savedSession?.id ?? persistedSessionId;
      } catch (sessionError) {
        console.log('saveKallpaSession error', sessionError);
        // Continue even if the session table is unavailable.
      }

      console.log('🚀 SAVING CASE WITH TRANSCRIPT:', {
        title,
        eventCount: timeline.length,
        firstEvent: timeline[0]?.content?.substring(0, 50)
      });

      await createManualKallpaCase({
        title,
        notes: manualNotes,
        scenario_id: baseSession.scenarioId,
        language: baseSession.language,
        session_id: persistedSessionId,
        clinic_type: scenarioMeta?.clinicType ?? 'Manual capture',
        attachments: manualAttachments,
        metadata,
      });

      console.log('✅ CASE SAVED SUCCESSFULLY! Now refreshing list...');
      
      Alert.alert(
        '✅ Clinical Case Saved!', 
        `Your recording has been saved to the database.\n\nTitle: ${title}\nEvents: ${timeline.length}`
      );
      setManualTitle('');
      setManualNotes('');
      setManualAttachments([]);
      
      // Refresh the saved cases list
      console.log('🔄 Calling refetchSavedCases...');
      await refetchSavedCases();
      console.log('✅ Refetch complete! Saved cases should now appear.');
    } catch (error) {
      console.log('❌ handleSaveManualCase error', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        '❌ Save Failed', 
        `Unable to save clinical case.\n\nError: ${error.message || 'Unknown error'}\n\nCheck Supabase connection.`
      );
    } finally {
      setIsSavingCase(false);
    }
  };

  const handleShareSession = async () => {
    triggerHaptic();
    const baseSession =
      selectedSession ?? (hasPrerecordedTranscript ? buildManualSessionFallback() : null);

    if (!baseSession) {
      Alert.alert('No session data', 'Record or attach a transcript before sharing.');
      return;
    }

    const scenarioMeta =
      scenarios.find((scenario) => scenario.id === baseSession.scenarioId) ??
      selectedSessionScenario ??
      null;
    const timeline = getTimelineWithImports(baseSession.events ?? []);
    const payload = {
      title: manualTitle.trim() || manualTitlePlaceholder,
      notes: manualNotes,
      scenario: {
        id: scenarioMeta?.id ?? baseSession.scenarioId,
        title: scenarioMeta?.title,
        language: baseSession.language,
        clinicType: scenarioMeta?.clinicType,
      },
      metrics: {
        durationMs: baseSession.durationMs,
        riskScore: baseSession.riskScore ?? scenarioMeta?.heroStats?.riskScore,
        decision: baseSession.finalDecision ?? scenarioMeta?.heroStats?.decisionLabel,
        variantSequence: baseSession.variantSequence,
        transcriptEventCount: timeline.length,
      },
      timeline,
      attachments: manualAttachments,
      exportedAt: new Date().toISOString(),
    };

    try {
      setIsSharingSession(true);
      const fileName = `kallpa-session-${baseSession.id}.json`;
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Share session export',
        });
      } else {
        const contents = await FileSystem.readAsStringAsync(fileUri);
        await Share.share({ title: fileName, message: contents });
      }
    } catch (error) {
      console.log('handleShareSession error', error);
      Alert.alert('Share failed', error.message ?? 'Unable to share session export.');
    } finally {
      setIsSharingSession(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>Kallpa PCAC</Text>
            <Text style={styles.title}>Case Studio</Text>
          </View>
        </View>

        <View style={styles.captureCard}>
          <View style={styles.captureHeader}>
            <View>
              <Text style={styles.captureTitle}>Manual encounter capture</Text>
              <Text style={styles.captureSubtitle}>
                Capture realtime audio clips or drop transcripts and turn them into Supabase-ready clinical cases.
              </Text>
            </View>
            {(isSavingCase || isUploadingAsset) && (
              <ActivityIndicator color="#22d3ee" />
            )}
          </View>

          <View style={styles.captureContent}>
            {recentSessions.length ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sessionChipsRow}
              >
                {recentSessions.map((session) => {
                  const scenarioMeta =
                    scenarios.find((s) => s.id === session.scenarioId) ?? null;
                  const isActive = selectedSessionId === session.id;
                  const chipTitle = buildSessionChipTitle(session, scenarioMeta);
                  return (
                    <View key={session.id} style={styles.sessionChipContainer}>
                      <Pressable
                        style={[styles.sessionChip, isActive && styles.sessionChipActive]}
                        onPress={() => {
                          triggerHaptic();
                          setSelectedSessionId(session.id);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={`Select session ${scenarioMeta?.title ?? session.scenarioId}`}
                      >
                        <Text style={styles.sessionChipTitle} numberOfLines={1}>
                          {chipTitle}
                        </Text>
                        <Text style={styles.sessionChipMeta}>
                          {formatDuration(session.durationMs)} •{' '}
                          {formatRelativeTime(session.startedAt)}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={styles.sessionChipDelete}
                        onPress={() => handleDeleteSession(session.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete session ${scenarioMeta?.title ?? session.scenarioId}`}
                      >
                        <Text style={styles.sessionChipDeleteText}>Remove</Text>
                      </Pressable>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.captureHint}>
                Use the realtime audio capture below or attach transcripts/evidence to log a manual case.
              </Text>
            )}

            <TextInput
              style={styles.captureInput}
              placeholder={manualTitlePlaceholder}
              placeholderTextColor="#64748b"
              value={manualTitle}
              onChangeText={setManualTitle}
            />
            <TextInput
              style={[styles.captureInput, styles.captureNotes]}
              placeholder="Add quick notes for this capture"
              placeholderTextColor="#64748b"
              multiline
              value={manualNotes}
              onChangeText={setManualNotes}
            />

            {/* TRANSCRIPT PREVIEW BOX - ONLY SHOWS FOR REAL AUDIO TRANSCRIPTION */}
            {hasPrerecordedTranscript && (
              <View style={styles.autoTranscriptPreview}>
                <View style={styles.autoTranscriptHeader}>
                  <Text style={styles.autoTranscriptTitle}>🎤 Audio Transcript</Text>
                  <Text style={styles.autoTranscriptMeta}>
                    {importedTranscriptEvents.length} lines - Real audio transcribed
                  </Text>
                </View>
                
                {/* SHOW REAL TRANSCRIBED TEXT */}
                <ScrollView style={styles.autoTranscriptScroll} nestedScrollEnabled>
                  <Text style={styles.autoTranscriptRawText} selectable>
                    {prerecordedTranscript}
                  </Text>
                </ScrollView>
              </View>
            )}

            {/* PLACEHOLDER FOR FUTURE AUDIO TRANSCRIPTION */}
            {selectedSession && !hasPrerecordedTranscript && (
              <View style={styles.audioInstructionBox}>
                <Text style={styles.audioInstructionTitle}>🎧 Add audio whenever you're ready</Text>
                <Text style={styles.audioInstructionText}>
                  Tap “Record audio” below or upload an existing file and we’ll build the transcript for you.
                </Text>
                <Text style={styles.audioInstructionStep}>• Use the realtime mic for bedside clips</Text>
                <Text style={styles.audioInstructionStep}>• Or import a .m4a/.mp3 recording</Text>
                <Text style={styles.audioInstructionStep}>• Notes only? That works too—just save.</Text>
              </View>
            )}

            {selectedSession ? (
              <View style={styles.sessionNameWrapper}>
                <View style={styles.sessionNameRow}>
                  <TextInput
                    style={[styles.captureInput, styles.sessionNameInput]}
                        ref={recordingNameInputRef}
                    placeholder="Name this recording (e.g., Dysuria follow-up)"
                    placeholderTextColor="#64748b"
                    value={sessionLabelDraft}
                    onChangeText={setSessionLabelDraft}
                  />
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      styles.sessionNameButton,
                      !sessionLabelHasChanges && styles.captureButtonDisabled,
                    ]}
                    onPress={handleSaveSessionLabel}
                    disabled={!sessionLabelHasChanges}
                    accessibilityRole="button"
                    accessibilityLabel="Save this case with a custom title"
                  >
                    <Text style={styles.secondaryButtonText}>Save case</Text>
                  </Pressable>
                </View>
                <Text style={styles.sessionNameHint}>
                  Custom labels replace the default “Case 01” text in your recording chips.
                </Text>
              </View>
            ) : null}

              <View style={styles.audioCapturePanel}>
                <View style={styles.audioCaptureHeader}>
                  <Text style={styles.audioCaptureTitle}>Realtime audio capture</Text>
                  <View
                    style={[
                      styles.audioStatusBadge,
                      isAudioRecording && styles.audioStatusBadgeActive,
                    ]}
                  >
                    <Text style={styles.audioStatusBadgeText}>
                      {isAudioRecording ? 'Recording' : 'Idle'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.audioCaptureHint}>
                  Record short patient moments inside this tab. When you stop, we automatically send the clip to Whisper-1 and merge the transcript into this manual case.
                </Text>
                {isWebPlatform && (
                  <View style={styles.audioWebWarning}>
                    <Text style={styles.audioWebWarningTitle}>Need a mobile device</Text>
                    <Text style={styles.audioWebWarningText}>
                      Browsers can’t access Expo’s native audio APIs. Scan the Expo Go QR code with your phone (same Wi-Fi) and record from there, or build the native app via EAS.
                    </Text>
                  </View>
                )}
                <View style={styles.audioCaptureStatsRow}>
                  <View>
                    <Text style={styles.audioCaptureStatLabel}>Mic permission</Text>
                    <Text
                      style={[
                        styles.audioCaptureStatValue,
                        hasAudioPermission
                          ? styles.audioCaptureStatValueReady
                          : styles.audioCaptureStatValueWarning,
                      ]}
                    >
                      {hasAudioPermission === null
                        ? 'Checking…'
                        : hasAudioPermission
                        ? 'Granted'
                        : 'Blocked'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.audioCaptureStatLabel}>Current clip</Text>
                    <Text style={styles.audioCaptureStatValue}>
                      {formatDuration(audioRecordingDuration || 0)}
                    </Text>
                  </View>
                  <View style={styles.audioCaptureStatusBlock}>
                    <Text style={styles.audioCaptureStatLabel}>Status</Text>
                    <Text style={styles.audioCaptureStatusText} numberOfLines={2}>
                      {audioStatusMessage}
                    </Text>
                  </View>
                </View>
                <View style={styles.audioCaptureButtonsRow}>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      styles.captureButton,
                      (!hasAudioPermission || isAudioRecording || isAudioTranscribing || isWebPlatform) &&
                        styles.captureButtonDisabled,
                    ]}
                    onPress={startAudioRecording}
                    disabled={!hasAudioPermission || isAudioRecording || isAudioTranscribing || isWebPlatform}
                    accessibilityRole="button"
                    accessibilityLabel="Start recording realtime audio"
                  >
                    <Text style={styles.secondaryButtonText}>
                      {isWebPlatform
                        ? 'Use Expo Go to record'
                        : hasAudioPermission === false
                        ? 'Enable mic'
                        : 'Record audio'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.destructiveButton,
                      styles.captureButton,
                      !isAudioRecording && styles.captureButtonDisabled,
                    ]}
                    onPress={stopAudioRecording}
                    disabled={!isAudioRecording}
                    accessibilityRole="button"
                    accessibilityLabel="Stop the audio recording and transcribe it"
                  >
                    <Text style={styles.destructiveButtonText}>Stop & transcribe</Text>
                  </Pressable>
                </View>
                {isAudioTranscribing ? (
                  <View style={styles.audioTranscribingRow}>
                    <ActivityIndicator color="#cbd5f5" />
                    <Text style={styles.audioTranscribingText}>
                      Uploading clip to Whisper…
                    </Text>
                  </View>
                ) : null}
                {lastAudioTranscriptPreview ? (
                  <View style={styles.audioTranscriptPreviewBox}>
                    <Text style={styles.audioTranscriptPreviewTitle}>
                      Latest transcript snippet
                    </Text>
                    <Text style={styles.audioTranscriptPreviewText} numberOfLines={4}>
                      {lastAudioTranscriptPreview}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.transcriptPanel}>
                <View style={styles.transcriptHeader}>
                  <Text style={styles.transcriptTitle}>Attach a recorded session</Text>
                  {hasPrerecordedTranscript ? (
                    <View
                      style={[
                        styles.transcriptBadge,
                        isTranscriptDirty
                          ? styles.transcriptBadgePending
                          : styles.transcriptBadgeReady,
                      ]}
                    >
                      <Text style={styles.transcriptBadgeText}>
                        {isTranscriptDirty
                          ? 'Needs convert'
                          : `${importedTranscriptEvents.length} events`}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.transcriptHint}>
                  Upload a .txt or .md export from Otter/Kallpa desktop (audio files must be transcribed first) and we’ll auto-convert every line into timeline events. You can still edit the transcript below before syncing.
                </Text>
                <TextInput
                  style={styles.transcriptInput}
                  placeholder="Paste transcript text or drop a recorded session file"
                  placeholderTextColor="#64748b"
                  multiline
                  value={prerecordedTranscript}
                  onChangeText={(text) => {
                    setPrerecordedTranscript(text);
                    setIsTranscriptDirty(true);
                  }}
                />
                {hasPrerecordedTranscript ? (
                  <Text style={styles.transcriptPreviewText}>
                    {isTranscriptDirty
                      ? 'Convert to refresh the synced timeline events.'
                      : 'Transcript synced—events will appear in exports and manual cases.'}
                  </Text>
                ) : (
                  <Text style={styles.captureHint}>
                    Optional, but useful for attaching previously recorded sections.
                  </Text>
                )}
                <View style={styles.transcriptButtonsRow}>
                  <Pressable
                    style={[styles.secondaryButton, styles.captureButton]}
                    onPress={handleTranscriptConvert}
                    disabled={!hasPrerecordedTranscript || isTranscriptProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Refresh the transcript timeline events"
                  >
                    {isTranscriptProcessing ? (
                      <ActivityIndicator color="#cbd5f5" />
                    ) : (
                      <Text style={styles.secondaryButtonText}>Refresh transcript</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryButton, styles.captureButton]}
                    onPress={handleImportTranscriptFile}
                    disabled={isTranscriptProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Import transcript text file"
                  >
                    <Text style={styles.secondaryButtonText}>Import file</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.secondaryButton, styles.captureButton, (!selectedSession || !selectedSession?.events?.length) && styles.captureButtonDisabled]}
                    onPress={handleUseRecordingTranscript}
                    disabled={!selectedSession || !selectedSession?.events?.length}
                    accessibilityRole="button"
                    accessibilityLabel="Copy the selected recording transcript into the text box"
                  >
                    <Text style={styles.secondaryButtonText}>Use recording transcript</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.destructiveButton, styles.captureButton, !hasPrerecordedTranscript && styles.captureButtonDisabled]}
                    onPress={handleClearTranscript}
                    disabled={!hasPrerecordedTranscript}
                    accessibilityRole="button"
                    accessibilityLabel="Clear the transcript input"
                  >
                    <Text style={styles.destructiveButtonText}>Clear transcript</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.manualAttachmentsRow}>
                {manualAttachments.length ? (
                  manualAttachments.map((attachment) => {
                    const mime = attachment.mimeType ?? attachment.type ?? 'file';
                    const badgeLabel = mime.includes('/')
                      ? mime.split('/')[0].toUpperCase()
                      : mime.toUpperCase();
                    return (
                      <View
                        key={attachment.id}
                        style={[
                          styles.manualAttachmentCard,
                          attachment.isPending && styles.manualAttachmentPending,
                        ]}
                      >
                        <View style={styles.manualAttachmentHeader}>
                          <View style={styles.manualAttachmentBadge}>
                            <Text style={styles.manualAttachmentBadgeText}>{badgeLabel}</Text>
                          </View>
                          <Text style={styles.manualAttachmentLabel} numberOfLines={1}>
                            {attachment.label ?? attachment.path}
                          </Text>
                        </View>
                        <View style={styles.manualAttachmentActions}>
                          {attachment.isPending ? (
                            <Text style={styles.manualAttachmentPendingText}>Uploading…</Text>
                          ) : (
                            (attachment.previewUri || attachment.url) && (
                              <Pressable
                                style={styles.manualAttachmentActionButton}
                                onPress={() => handlePreviewAttachment(attachment)}
                                accessibilityRole="button"
                                accessibilityLabel={`Preview attachment ${attachment.label ?? attachment.id}`}
                              >
                                <Text style={styles.manualAttachmentActionText}>Open</Text>
                              </Pressable>
                            )
                          )}
                          <Pressable
                            style={[styles.manualAttachmentActionButton, styles.manualAttachmentRemoveButton]}
                            onPress={() => handleRemoveAttachment(attachment.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove attachment ${attachment.label ?? attachment.id}`}
                          >
                            <Text style={styles.manualAttachmentRemoveText}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.captureHint}>No evidence uploaded yet.</Text>
                )}
              </View>
              <Text style={styles.captureHint}>
                Grant Files/Photos access when prompted so DocumentPicker can attach previews.
              </Text>

              <View style={styles.timelinePreviewPanel}>
                <View style={styles.timelinePreviewHeader}>
                  <Text style={styles.timelinePreviewTitle}>Recorded session timeline</Text>
                  <Text style={styles.timelinePreviewMeta}>
                    {selectedSession
                      ? `${sessionTimelinePreview.length} events`
                      : 'No session selected'}
                  </Text>
                </View>
                {selectedSession ? (
                  sessionTimelinePreview.length ? (
                    <View style={styles.timelinePreviewList}>
                      {sessionTimelinePreview.slice(0, 18).map((event) => (
                        <View key={event.id} style={styles.timelinePreviewRow}>
                          <View style={styles.timelinePreviewDot} />
                          <View style={styles.timelinePreviewContent}>
                            <Text style={styles.timelinePreviewType}>{event.type}</Text>
                            <Text style={styles.timelinePreviewText} numberOfLines={2}>
                              {(event.content ?? event.label ?? event.role ?? 'event').toString()} •{' '}
                              {formatRelativeTime(event.timestamp)}
                            </Text>
                          </View>
                        </View>
                      ))}
                      {sessionTimelinePreview.length > 18 && (
                        <Text style={styles.timelinePreviewOverflow}>
                          +{sessionTimelinePreview.length - 18} more events in session
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.timelinePreviewEmpty}>
                      No events captured yet. Stop an audio capture or import a transcript to see the script here.
                    </Text>
                  )
                ) : (
                  <Text style={styles.timelinePreviewEmpty}>
                    Pick a session chip to inspect the captured script.
                  </Text>
                )}
              </View>

              <View style={styles.sessionTranscriptPanel}>
                <View style={styles.sessionTranscriptHeader}>
                  <Text style={styles.sessionTranscriptTitle}>Recording Transcript</Text>
                  <Text style={styles.sessionTranscriptMeta}>
                    {sessionTranscriptLines.length
                      ? `${sessionTranscriptLines.length} lines - Read what was said`
                      : 'No transcript captured'}
                  </Text>
                </View>
                {sessionTranscriptLines.length ? (
                  <ScrollView style={styles.sessionTranscriptList}>
                    {sessionTranscriptLines.map((entry) => (
                      <View key={entry.id} style={styles.sessionTranscriptRow}>
                        <Text style={styles.sessionTranscriptRole}>{entry.role}</Text>
                        <Text style={styles.sessionTranscriptText}>{entry.content}</Text>
                        <Text style={styles.sessionTranscriptTimestamp}>
                          {formatRelativeTime(entry.timestamp)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.sessionTranscriptEmpty}>
                    Stop an audio capture to automatically fill this transcript, or upload an existing file below.
                  </Text>
                )}
              </View>

            <View style={styles.captureButtons}>
              <Pressable
                style={[styles.secondaryButton, styles.captureButton]}
                onPress={handleUploadAttachment}
                disabled={isUploadingAsset}
                accessibilityRole="button"
                accessibilityLabel="Upload supporting evidence to the manual capture"
              >
                {isUploadingAsset ? (
                  <ActivityIndicator color="#cbd5f5" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Upload evidence</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, styles.captureButton]}
                onPress={handleShareSession}
                disabled={!selectedSession || isSharingSession}
                accessibilityRole="button"
                accessibilityLabel="Share the current session as a JSON export"
              >
                {isSharingSession ? (
                  <ActivityIndicator color="#cbd5f5" />
                ) : (
                  <Text style={styles.secondaryButtonText}>Share session</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.captureButton, !(selectedSession || hasPrerecordedTranscript) && styles.captureButtonDisabled]}
                onPress={handleSaveManualCase}
                disabled={!(selectedSession || hasPrerecordedTranscript) || isSavingCase}
                accessibilityRole="button"
                accessibilityLabel="Save the manual case to Supabase"
              >
                <Text style={styles.primaryButtonText}>
                  {isSavingCase ? 'Saving…' : 'Save manual case'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Symptom cluster</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {symptomClusters.map((label) => (
              <Pressable
                key={label}
                onPress={() => {
                  triggerHaptic();
                  setSymptomFilter(label);
                }}
                style={[
                  styles.filterChip,
                  symptomFilter === label && styles.filterChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by symptom cluster ${label}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    symptomFilter === label && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Outcome</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {riskOutcomes.map((label) => (
              <Pressable
                key={label}
                onPress={() => {
                  triggerHaptic();
                  setOutcomeFilter(label);
                }}
                style={[
                  styles.filterChip,
                  outcomeFilter === label && styles.filterChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by outcome ${label}`}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    outcomeFilter === label && styles.filterChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* YOUR SAVED CLINICAL CASES */}
        <View style={styles.savedCasesSection}>
          <Text style={styles.savedCasesTitle}>📋 Your Saved Clinical Cases</Text>
          <Text style={styles.savedCasesMeta}>
            {deletingCaseId
              ? 'Removing case…'
              : isLoadingSavedCases
              ? 'Loading…'
              : `${savedCases?.length || 0} saved cases`}
          </Text>
          {!isLoadingSavedCases && !deletingCaseId && savedCases?.length ? (
            <Text style={styles.savedCasesHint}>
              Tap Delete to clean up older captures—the list refreshes instantly.
            </Text>
          ) : null}
        </View>

        {savedCases && savedCases.length > 0 ? (
          <View style={styles.cardsColumn}>
            {savedCases.map((clinicalCase) => {
              // Extract transcript from metadata
              const events = clinicalCase.metadata?.events || [];
              const transcriptLines = events
                .filter(e => e.content && typeof e.content === 'string')
                .map(e => e.content.trim())
                .filter(Boolean);
              const isDeletingThisCase = deletingCaseId === clinicalCase.id;
              const isEditingThisCase = editingCaseId === clinicalCase.id;
              
              return (
                <View key={clinicalCase.id} style={[styles.card, styles.savedCaseCard]}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {clinicalCase.title || 'Manual case'}
                      </Text>
                    </View>
                    <View style={styles.savedCaseActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Edit saved case ${clinicalCase.title}`}
                        onPress={() => beginEditingCase(clinicalCase)}
                        style={[
                          styles.savedCaseSecondaryButton,
                          isEditingThisCase && styles.savedCaseSecondaryButtonActive,
                        ]}
                      >
                        <Text style={styles.savedCaseSecondaryText}>
                          {isEditingThisCase ? 'Editing' : 'Edit'}
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete saved case ${clinicalCase.title}`}
                        onPress={() => confirmDeleteSavedCase(clinicalCase)}
                        style={[
                          styles.savedCaseDeleteButton,
                          isDeletingThisCase && styles.savedCaseDeleteButtonDisabled,
                        ]}
                        disabled={isDeletingThisCase}
                      >
                        {isDeletingThisCase ? (
                          <ActivityIndicator size="small" color="#fecdd3" />
                        ) : (
                          <Text style={styles.savedCaseDeleteText}>Delete</Text>
                        )}
                      </Pressable>
                      <View style={[styles.cardBadge, { backgroundColor: '#f97316' }]}>
                        <Text style={styles.cardBadgeText}>✓ SAVED</Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.cardMeta}>{clinicalCase.clinic_type || 'Clinical Case'}</Text>
                  
                  {clinicalCase.notes && (
                    <Text style={styles.hpiText}>{clinicalCase.notes}</Text>
                  )}

                  {isEditingThisCase && (
                    <View style={styles.savedCaseEditSection}>
                      <Text style={styles.savedCaseEditLabel}>Case title</Text>
                      <TextInput
                        value={editCaseTitle}
                        onChangeText={setEditCaseTitle}
                        placeholder="Edit case title"
                        placeholderTextColor="#94a3b8"
                        style={styles.savedCaseEditInput}
                      />
                      <Text style={styles.savedCaseEditLabel}>Clinical notes</Text>
                      <TextInput
                        value={editCaseNotes}
                        onChangeText={setEditCaseNotes}
                        placeholder="Update the patient notes"
                        placeholderTextColor="#94a3b8"
                        style={[styles.savedCaseEditInput, styles.savedCaseEditTextarea]}
                        multiline
                        numberOfLines={4}
                      />
                      <Text style={styles.savedCaseEditLabel}>Transcript (one line per utterance)</Text>
                      <TextInput
                        value={editCaseTranscript}
                        onChangeText={setEditCaseTranscript}
                        placeholder="Type transcript text here"
                        placeholderTextColor="#94a3b8"
                        style={[styles.savedCaseEditInput, styles.savedCaseEditTextarea]}
                        multiline
                        numberOfLines={6}
                      />
                      <View style={styles.savedCaseEditActions}>
                        <Pressable
                          onPress={cancelEditingCase}
                          style={[styles.savedCaseSecondaryButton, styles.savedCaseEditActionButton]}
                        >
                          <Text style={styles.savedCaseSecondaryText}>Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={saveEditedCase}
                          style={[styles.savedCaseSaveButton, styles.savedCaseEditActionButton]}
                          disabled={savingEditedCaseId === clinicalCase.id}
                        >
                          {savingEditedCaseId === clinicalCase.id ? (
                            <ActivityIndicator size="small" color="#0f172a" />
                          ) : (
                            <Text style={styles.savedCaseSaveText}>Save changes</Text>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  )}

                  {/* TRANSCRIPT SECTION */}
                  {transcriptLines.length > 0 && (
                    <View style={styles.transcriptSection}>
                      <Text style={styles.savedCaseTranscriptTitle}>
                        📝 Recording Transcript ({transcriptLines.length} lines)
                      </Text>
                      <View style={styles.transcriptBox}>
                        {transcriptLines.slice(0, 10).map((line, idx) => (
                          <Text key={idx} style={styles.transcriptLine}>
                            • {line}
                          </Text>
                        ))}
                        {transcriptLines.length > 10 && (
                          <Text style={styles.transcriptMore}>
                            +{transcriptLines.length - 10} more lines...
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  <View style={styles.cardStatsRow}>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillText}>
                        {clinicalCase.metadata?.decision || 'Clinical case'}
                      </Text>
                    </View>
                    <View style={styles.statPill}>
                      <Text style={styles.statPillText}>
                        {clinicalCase.created_at
                          ? new Date(clinicalCase.created_at).toLocaleDateString()
                          : 'Recently saved'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : !isLoadingSavedCases ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No saved cases yet. Record something and tap "Save label" to create your first clinical case. Each time you save or delete, this list updates automatically.
            </Text>
          </View>
        ) : null}

        {/* DEMO SCENARIOS */}
        <View style={styles.demoSectionHeader}>
          <Text style={styles.savedCasesTitle}>📚 Demo Scenarios (for practice)</Text>
        </View>

        <View style={styles.cardsColumn}>
          {filteredCases.map((scenario) => (
            <View key={scenario.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{scenario.title}</Text>
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{scenario.language.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.cardMeta}>{scenario.clinicType}</Text>
              <Text style={styles.cardMeta}>{scenario.symptomCluster}</Text>

              <View style={styles.cardStatsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>
                    {scenario.heroStats?.riskLabel ?? 'Risk —'}
                  </Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillText}>
                    {scenario.heroStats?.decisionLabel ?? 'Outcome —'}
                  </Text>
                </View>
              </View>

              <Text style={styles.hpiLabel}>HPI snapshot</Text>
              <Text style={styles.hpiText}>{scenario.detail?.hpi}</Text>

              {scenario.clinicalHistory?.summary && (
                <View style={styles.historySection}>
                  <Text style={styles.historySummary}>
                    {scenario.clinicalHistory.summary}
                  </Text>
                  <View style={styles.historyTagsRow}>
                    {[
                      scenario.clinicalHistory.pastMedical?.[0],
                      scenario.clinicalHistory.medications?.[0],
                      scenario.clinicalHistory.allergies?.[0],
                    ]
                      .filter(Boolean)
                      .map((tag) => (
                        <View key={`${scenario.id}-${tag}`} style={styles.historyTag}>
                          <Text style={styles.historyTagText}>{tag}</Text>
                        </View>
                      ))}
                  </View>
                </View>
              )}

              {scenario.labs?.baseline?.length ? (
                <View style={styles.labsSection}>
                  {scenario.labs.baseline.slice(0, 3).map((lab, index) => {
                    const flagKey = (lab.flag ?? '').toLowerCase();
                    const flagColor = labFlagColors[flagKey] ?? '#94a3b8';
                    return (
                      <View key={`${scenario.id}-${lab.name}-${index}`} style={styles.labBadge}>
                        <Text style={styles.labBadgeName}>{lab.name}</Text>
                        <Text style={styles.labBadgeValue}>
                          {lab.value}
                          {lab.unit ? ` ${lab.unit}` : ''}
                        </Text>
                        {lab.flag && (
                          <Text style={[styles.labBadgeFlag, { color: flagColor }]}>
                            {lab.flag}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {scenario.attachments?.length ? (
                <View style={styles.attachmentsPreviewRow}>
                  {scenario.attachments.slice(0, 2).map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentPreviewCard}>
                      <Image
                        source={{
                          uri:
                            attachment.thumbnail ??
                            attachment.url ??
                            'https://placehold.co/160x90?text=asset',
                        }}
                        style={styles.attachmentPreviewImage}
                      />
                      <Text style={styles.attachmentPreviewLabel} numberOfLines={1}>
                        {attachment.label}
                      </Text>
                    </View>
                  ))}
                  {scenario.attachments.length > 2 && (
                    <Text style={styles.attachmentsOverflowText}>
                      +{scenario.attachments.length - 2} more
                    </Text>
                  )}
                </View>
              ) : null}

              {scenario.detail?.learningPoints?.length ? (
                <View style={styles.learningSection}>
                  {scenario.detail.learningPoints.map((point) => (
                    <View key={point} style={styles.learningRow}>
                      <View style={styles.learningDot} />
                      <Text style={styles.learningText}>{point}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.openButton, styles.secondaryButton]}
                  onPress={() => goToCaseDetail(scenario.id)}
                >
                  <Text style={styles.secondaryButtonText}>Case detail</Text>
                </Pressable>
                <Pressable
                  style={[styles.openButton, styles.primaryButton]}
                  onPress={() => openScenarioInVisit(scenario)}
                >
                  <Text style={styles.primaryButtonText}>Open Visit tab</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Cases;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#010409',
  },
  container: {
    padding: 20,
    gap: 20,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    color: '#9ca3af',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(34,211,238,0.2)',
    borderColor: '#22d3ee',
  },
  filterChipText: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#22d3ee',
  },
  cardsColumn: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.15)',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0,
  },
  cardTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
  },
  cardBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  cardMeta: {
    color: '#94a3b8',
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statPillText: {
    color: '#cbd5f5',
    fontWeight: '600',
  },
  hpiLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  hpiText: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 20,
  },
  learningSection: {
    gap: 8,
  },
  learningRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  learningDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#fb923c',
  },
  learningText: {
    color: '#f8fafc',
    flex: 1,
  },
  openButton: {
    flex: 1,
    marginTop: 4,
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#f97316',
  },
  primaryButtonText: {
    color: '#0f172a',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#cbd5f5',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  destructiveButton: {
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)',
    backgroundColor: 'rgba(127,29,29,0.35)',
  },
  destructiveButtonText: {
    color: '#fee2e2',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  captureCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#041026',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    gap: 12,
  },
  captureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  captureTitle: {
    color: '#e0f2fe',
    fontSize: 16,
    fontWeight: '700',
  },
  captureSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  captureContent: {
    gap: 12,
  },
  captureHint: {
    color: '#94a3b8',
    fontSize: 14,
  },
  sessionChipsRow: {
    gap: 10,
  },
  sessionChipContainer: {
    width: 220,
    position: 'relative',
  },
  sessionChip: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    gap: 4,
  },
  sessionChipActive: {
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(34,211,238,0.12)',
  },
  sessionChipDelete: {
    position: 'absolute',
    top: -6,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.4)',
  },
  sessionChipDeleteText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sessionChipTitle: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  sessionChipMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  captureInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
  },
  captureNotes: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  // AUTO-TRANSCRIPTION PREVIEW BOX
  autoTranscriptPreview: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.4)',
    backgroundColor: 'rgba(20,83,45,0.2)',
    padding: 14,
    gap: 10,
    maxHeight: 280,
  },
  autoTranscriptHeader: {
    gap: 4,
  },
  autoTranscriptTitle: {
    color: '#86efac',
    fontSize: 15,
    fontWeight: '700',
  },
  autoTranscriptMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  autoTranscriptScroll: {
    maxHeight: 200,
  },
  autoTranscriptLine: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.1)',
  },
  autoTranscriptRole: {
    color: '#6ee7b7',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    minWidth: 60,
  },
  autoTranscriptText: {
    color: '#e2e8f0',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  autoTranscriptMore: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  autoTranscriptRawText: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: 'rgba(15,23,42,0.6)',
    padding: 12,
    borderRadius: 10,
    fontFamily: 'monospace',
  },
  // AUDIO INSTRUCTION BOX
  audioInstructionBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(59,130,246,0.4)',
    backgroundColor: 'rgba(30,58,138,0.2)',
    padding: 14,
    gap: 8,
  },
  audioInstructionTitle: {
    color: '#60a5fa',
    fontSize: 15,
    fontWeight: '700',
  },
  audioInstructionText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 4,
  },
  audioInstructionStep: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 4,
    lineHeight: 18,
  },
  audioCapturePanel: {
    backgroundColor: '#010b1f',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
    padding: 16,
    gap: 12,
  },
  audioCaptureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioCaptureTitle: {
    color: '#bfdbfe',
    fontSize: 16,
    fontWeight: '700',
  },
  audioCaptureHint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  audioWebWarning: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.45)',
    backgroundColor: 'rgba(127,29,29,0.25)',
    padding: 12,
    gap: 4,
  },
  audioWebWarningTitle: {
    color: '#fecdd3',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  audioWebWarningText: {
    color: '#ffe4e6',
    fontSize: 12,
    lineHeight: 18,
  },
  audioCaptureStatsRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioCaptureStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  audioCaptureStatValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  audioCaptureStatValueReady: {
    color: '#86efac',
  },
  audioCaptureStatValueWarning: {
    color: '#fca5a5',
  },
  audioCaptureStatusBlock: {
    flex: 1,
  },
  audioCaptureStatusText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  audioCaptureButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  audioStatusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(37,99,235,0.1)',
  },
  audioStatusBadgeActive: {
    borderColor: 'rgba(248,113,113,0.5)',
    backgroundColor: 'rgba(248,113,113,0.15)',
  },
  audioStatusBadgeText: {
    color: '#bfdbfe',
    fontWeight: '700',
    fontSize: 12,
  },
  audioTranscribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioTranscribingText: {
    color: '#cbd5f5',
    fontSize: 13,
  },
  audioTranscriptPreviewBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    padding: 12,
    gap: 6,
  },
  audioTranscriptPreviewTitle: {
    color: '#bfdbfe',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  audioTranscriptPreviewText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 18,
  },
  autoTranscriptDivider: {
    height: 1,
    backgroundColor: 'rgba(148,163,184,0.2)',
    marginVertical: 12,
  },
  autoTranscriptSectionTitle: {
    color: '#86efac',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  autoTranscriptLinesPreview: {
    gap: 4,
  },
  sessionNameWrapper: {
    gap: 6,
  },
  sessionNameRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  sessionNameInput: {
    flex: 1,
  },
  sessionNameButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sessionNameHint: {
    color: '#94a3b8',
    fontSize: 12,
  },
  scenarioPicker: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(15,23,42,0.8)',
    padding: 12,
    gap: 8,
  },
  scenarioPickerHeader: {
    gap: 4,
  },
  scenarioPickerTitle: {
    color: '#c7d2fe',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  scenarioPickerHint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
  },
  scenarioPickerRow: {
    gap: 10,
    paddingVertical: 4,
  },
  scenarioPickerChip: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    padding: 10,
    gap: 2,
  },
  scenarioPickerChipActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99,102,241,0.15)',
  },
  scenarioPickerChipTitle: {
    color: '#f1f5f9',
    fontWeight: '600',
  },
  scenarioPickerChipMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  transcriptPanel: {
    backgroundColor: '#0b1120',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    padding: 16,
    gap: 12,
  },
  transcriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  transcriptTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptHint: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  transcriptInput: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    padding: 12,
    color: '#f8fafc',
    textAlignVertical: 'top',
  },
  transcriptBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  transcriptBadgePending: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    borderColor: 'rgba(248,113,113,0.5)',
  },
  transcriptBadgeReady: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderColor: 'rgba(34,197,94,0.5)',
  },
  transcriptBadgeText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  transcriptPreviewText: {
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  transcriptButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  manualAttachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  manualAttachmentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    backgroundColor: 'rgba(2,6,23,0.6)',
    padding: 10,
    gap: 8,
    minWidth: 160,
  },
  manualAttachmentPending: {
    borderColor: 'rgba(59,130,246,0.6)',
    backgroundColor: 'rgba(30,64,175,0.25)',
  },
  manualAttachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manualAttachmentBadge: {
    borderRadius: 8,
    backgroundColor: 'rgba(34,211,238,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  manualAttachmentBadgeText: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '700',
  },
  manualAttachmentLabel: {
    color: '#cbd5f5',
    maxWidth: 140,
  },
  manualAttachmentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  manualAttachmentActionButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  manualAttachmentActionText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  manualAttachmentPendingText: {
    color: '#bfdbfe',
    fontSize: 12,
    fontStyle: 'italic',
  },
  manualAttachmentRemoveButton: {
    borderColor: 'rgba(248,113,113,0.5)',
    backgroundColor: 'rgba(127,29,29,0.3)',
  },
  manualAttachmentRemoveText: {
    color: '#fecdd3',
    fontSize: 12,
    fontWeight: '700',
  },
  timelinePreviewPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.3)',
    backgroundColor: 'rgba(15,23,42,0.7)',
    padding: 14,
    gap: 10,
  },
  timelinePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelinePreviewTitle: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
  },
  timelinePreviewMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  timelinePreviewList: {
    gap: 8,
  },
  timelinePreviewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelinePreviewDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#22d3ee',
    marginTop: 6,
  },
  timelinePreviewContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.2)',
    paddingBottom: 8,
  },
  timelinePreviewType: {
    color: '#bae6fd',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  timelinePreviewText: {
    color: '#f8fafc',
    fontSize: 13,
  },
  timelinePreviewOverflow: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  timelinePreviewEmpty: {
    color: '#94a3b8',
    fontSize: 13,
  },
  sessionTranscriptPanel: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    backgroundColor: 'rgba(6,78,59,0.3)',
    padding: 14,
    gap: 10,
  },
  sessionTranscriptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTranscriptTitle: {
    color: '#bbf7d0',
    fontSize: 15,
    fontWeight: '700',
  },
  sessionTranscriptMeta: {
    color: '#a7f3d0',
    fontSize: 12,
  },
  sessionTranscriptList: {
    gap: 8,
  },
  sessionTranscriptRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16,185,129,0.2)',
    paddingBottom: 8,
    gap: 4,
  },
  sessionTranscriptRole: {
    color: '#d1fae5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sessionTranscriptText: {
    color: '#ecfccb',
    fontSize: 13,
    lineHeight: 18,
  },
  sessionTranscriptTimestamp: {
    color: '#a7f3d0',
    fontSize: 11,
    fontStyle: 'italic',
  },
  sessionTranscriptEmpty: {
    color: '#94a3b8',
    fontSize: 13,
  },
  captureButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  captureButton: {
    flex: 1,
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  historySection: {
    marginTop: 4,
    gap: 6,
  },
  historySummary: {
    color: '#cbd5f5',
    fontSize: 14,
  },
  historyTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  historyTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(22,163,74,0.15)',
  },
  historyTagText: {
    color: '#86efac',
    fontSize: 12,
    fontWeight: '600',
  },
  labsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labBadge: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(30,64,175,0.2)',
    padding: 10,
    gap: 2,
    minWidth: 120,
  },
  labBadgeName: {
    color: '#bfdbfe',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  labBadgeValue: {
    color: '#f1f5f9',
    fontWeight: '700',
  },
  labBadgeFlag: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  attachmentsPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  attachmentPreviewCard: {
    width: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    overflow: 'hidden',
  },
  attachmentPreviewImage: {
    width: '100%',
    height: 60,
  },
  attachmentPreviewLabel: {
    color: '#e2e8f0',
    fontSize: 11,
    padding: 6,
  },
  attachmentsOverflowText: {
    color: '#cbd5f5',
    fontSize: 12,
  },
  // SAVED CASES SECTION
  savedCasesSection: {
    gap: 6,
    marginBottom: 12,
  },
  savedCasesTitle: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '700',
  },
  savedCasesMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  savedCasesHint: {
    color: '#64748b',
    fontSize: 12,
  },
  savedCaseCard: {
    borderColor: 'rgba(34,197,94,0.3)',
    backgroundColor: 'rgba(20,83,45,0.15)',
  },
  savedCaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedCaseSecondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.4)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  savedCaseSecondaryButtonActive: {
    borderColor: '#38bdf8',
  },
  savedCaseSecondaryText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  savedCaseDeleteButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.5)',
    backgroundColor: 'rgba(127,29,29,0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  savedCaseDeleteButtonDisabled: {
    opacity: 0.6,
  },
  savedCaseDeleteText: {
    color: '#fecdd3',
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontSize: 11,
  },
  savedCaseEditSection: {
    marginTop: 12,
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
    backgroundColor: 'rgba(15,23,42,0.6)',
    padding: 12,
  },
  savedCaseEditLabel: {
    color: '#cbd5f5',
    fontSize: 13,
    fontWeight: '600',
  },
  savedCaseEditInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    backgroundColor: 'rgba(2,6,23,0.6)',
  },
  savedCaseEditTextarea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  savedCaseEditActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  savedCaseEditActionButton: {
    flex: 1,
    alignItems: 'center',
  },
  savedCaseSaveButton: {
    borderRadius: 999,
    backgroundColor: '#22d3ee',
    paddingVertical: 10,
  },
  savedCaseSaveText: {
    color: '#0f172a',
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  transcriptSection: {
    marginTop: 8,
    gap: 6,
  },
  savedCaseTranscriptTitle: {
    color: '#86efac',
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptBox: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    gap: 6,
  },
  transcriptLine: {
    color: '#cbd5f5',
    fontSize: 13,
    lineHeight: 18,
  },
  transcriptMore: {
    color: '#94a3b8',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  demoSectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(2,6,23,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
