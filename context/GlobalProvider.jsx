// context/GlobalProvider.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/appwrite';
import kallpaScenarios from '../data/kallpaScenarios.json';
import impactMetrics from '../data/impactMetrics.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCENARIOS_CACHE_KEY = 'kallpa:scenarios-cache-v1';

const GlobalContext = createContext(null);

export const useGlobalContext = () => useContext(GlobalContext);

const clonePanelState = (panel) => {
  if (!panel) return null;
  return {
    ...panel,
    orders: Array.isArray(panel.orders)
      ? panel.orders.map((order) => ({ ...order }))
      : [],
    reasons: Array.isArray(panel.reasons)
      ? [...panel.reasons]
      : [],
  };
};

const applyVariantOverrides = (current, variant) => {
  if (!variant) return current;
  const next = { ...current };

  Object.entries(variant).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      next[key] = value.map((item) =>
        item && typeof item === 'object' ? { ...item } : item
      );
    } else if (value && typeof value === 'object') {
      next[key] = { ...value };
    } else {
      next[key] = value;
    }
  });

  return next;
};

const derivePanelState = (scenario, activeVariants) => {
  if (!scenario?.panels?.base) return null;

  const baseState = clonePanelState(scenario.panels.base);
  const variantMap = scenario.panels.variants ?? {};
  if (!activeVariants?.length) {
    return baseState;
  }

  const sortedIds = [...activeVariants].sort();
  const compositeKey = sortedIds.join('|');
  if (variantMap[compositeKey]) {
    return applyVariantOverrides(baseState, variantMap[compositeKey]);
  }

  return sortedIds.reduce((acc, variantId) => {
    if (variantMap[variantId]) {
      return applyVariantOverrides(acc, variantMap[variantId]);
    }
    return acc;
  }, baseState);
};

const cloneLabs = (labs) =>
  Array.isArray(labs) ? labs.map((lab) => ({ ...lab })) : [];

const deriveLabsState = (scenario, activeVariants) => {
  const baseLabs = cloneLabs(scenario?.labs?.baseline ?? []);
  const variantMap = scenario?.labs?.variants ?? {};
  if (!activeVariants?.length) {
    return baseLabs;
  }

  const sortedIds = [...activeVariants].sort();
  const compositeKey = sortedIds.join('|');
  if (variantMap[compositeKey]) {
    return baseLabs.concat(cloneLabs(variantMap[compositeKey]));
  }

  return sortedIds.reduce((acc, variantId) => {
    if (variantMap[variantId]) {
      return acc.concat(cloneLabs(variantMap[variantId]));
    }
    return acc;
  }, baseLabs);
};

export const GlobalProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [scenarios, setScenarios] = useState(kallpaScenarios);
  const [selectedScenarioId, setSelectedScenarioId] = useState(
    kallpaScenarios[0]?.id ?? null
  );
  const [activeVariants, setActiveVariants] = useState([]);
  const [language, setLanguage] = useState('en');
  const [recording, setRecording] = useState({
    isRecording: false,
    startedAt: null,
    events: [],
    scenarioId: null,
    language: 'en',
    id: null,
  });
  const [sessionHistory, setSessionHistory] = useState([]);
  const impactProfiles = impactMetrics?.profiles ?? [];
  const [selectedImpactProfileId, setSelectedImpactProfileId] = useState(
    impactProfiles[0]?.id ?? null
  );
  const queuedVariantsRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.log('getUser error:', error.message);
          if (!isMounted) return;
          setUser(null);
          setIsLoggedIn(false);
        } else if (data?.user) {
          if (!isMounted) return;
          setUser(data.user);
          setIsLoggedIn(true);
        } else {
          if (!isMounted) return;
          setUser(null);
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.log('Auth init error:', err);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        setIsLoggedIn(!!currentUser);
      }
    );

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const hydrateScenarios = async () => {
      try {
        const cached = await AsyncStorage.getItem(SCENARIOS_CACHE_KEY);
        if (!cached || !isMounted) {
          if (!cached) {
            await AsyncStorage.setItem(
              SCENARIOS_CACHE_KEY,
              JSON.stringify(kallpaScenarios)
            );
          }
          return;
        }
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length && isMounted) {
          setScenarios(parsed);
        }
      } catch (error) {
        console.log('hydrateScenarios error:', error);
      }
    };

    hydrateScenarios();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!scenarios?.length) return;
    AsyncStorage.setItem(SCENARIOS_CACHE_KEY, JSON.stringify(scenarios)).catch((error) =>
      console.log('persistScenarios error:', error)
    );
  }, [scenarios]);

  useEffect(() => {
    if (!scenarios.length) return;
    setSelectedScenarioId((prev) => {
      if (prev && scenarios.some((scenario) => scenario.id === prev)) {
        return prev;
      }
      return scenarios[0]?.id ?? prev;
    });
  }, [scenarios]);

  useEffect(() => {
    // When switching scenarios, load any queued variants (e.g., from Case detail playbooks)
    if (queuedVariantsRef.current) {
      setActiveVariants(queuedVariantsRef.current);
      queuedVariantsRef.current = null;
      return;
    }
    setActiveVariants([]);
  }, [selectedScenarioId]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.log('Logout error:', error);
        throw error;
      }
      // Clear state
      setUser(null);
      setIsLoggedIn(false);
      // Navigate to sign-in
      router.replace('/sign-in');
    } catch (err) {
      console.log('Logout failed:', err);
      throw err;
    }
  };

  const toggleVariant = useCallback((variantId) => {
    setActiveVariants((prev) => {
      if (prev.includes(variantId)) {
        return prev.filter((id) => id !== variantId);
      }
      return [...prev, variantId];
    });
  }, []);

  const forceVariants = useCallback((nextVariantIds = []) => {
    setActiveVariants(
      Array.isArray(nextVariantIds) ? [...nextVariantIds] : []
    );
  }, []);

  const presetVariantsForNextScenario = useCallback((variantIds = []) => {
    queuedVariantsRef.current = Array.isArray(variantIds)
      ? [...variantIds]
      : [];
  }, []);

  const selectScenario = useCallback(
    (scenarioId, options = {}) => {
      if (!scenarioId || scenarioId === selectedScenarioId) return;
      setSelectedScenarioId(scenarioId);
      const { language: preferredLanguage, preserveVariants } = options;
      if (!preserveVariants) {
        setActiveVariants([]);
      }
      if (preferredLanguage && preferredLanguage !== language) {
        setLanguage(preferredLanguage);
      }
    },
    [language, selectedScenarioId]
  );

  const selectedScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === selectedScenarioId) ?? null,
    [scenarios, selectedScenarioId]
  );

  const panelState = useMemo(
    () => derivePanelState(selectedScenario, activeVariants),
    [selectedScenario, activeVariants]
  );

  const labsState = useMemo(
    () => deriveLabsState(selectedScenario, activeVariants),
    [selectedScenario, activeVariants]
  );

  const selectedImpactProfile = useMemo(
    () =>
      impactProfiles.find((profile) => profile.id === selectedImpactProfileId) ??
      impactProfiles[0] ??
      null,
    [impactProfiles, selectedImpactProfileId]
  );

  const startRecording = useCallback(() => {
    setRecording((prev) => {
      if (prev.isRecording) return prev;
      const startedAt = Date.now();
      return {
        isRecording: true,
        startedAt,
        events: [
          {
            id: `session-start-${startedAt}`,
            timestamp: startedAt,
            type: 'session-start',
            scenarioId: selectedScenarioId,
            language,
          },
        ],
        scenarioId: selectedScenarioId,
        language,
        id: `session-${startedAt}`,
      };
    });
  }, [language, selectedScenarioId]);

  const logRecordingEvent = useCallback((event = {}) => {
    setRecording((prev) => {
      if (!prev.isRecording) return prev;
      const nextEvent = {
        id: `${event.type ?? 'event'}-${Date.now()}`,
        timestamp: Date.now(),
        ...event,
      };
      return {
        ...prev,
        events: [...prev.events, nextEvent],
      };
    });
  }, []);

  const stopRecording = useCallback(
    (metadata = {}) => {
      setRecording((prev) => {
        if (!prev.isRecording) return prev;
        const durationMs = Date.now() - (prev.startedAt ?? Date.now());
        const completedSession = {
          id: prev.id ?? `session-${prev.startedAt ?? Date.now()}`,
          scenarioId: prev.scenarioId ?? selectedScenarioId,
          startedAt: prev.startedAt ?? Date.now(),
          durationMs,
          language: prev.language ?? language,
          events: prev.events,
          variantSequence: activeVariants,
          finalDecision: panelState?.decision ?? null,
          riskScore: panelState?.riskScore ?? null,
          metadata,
        };
        setSessionHistory((history) => [completedSession, ...history]);
        return {
          isRecording: false,
          startedAt: null,
          events: [],
          scenarioId: null,
          language,
          id: null,
        };
      });
    },
    [activeVariants, panelState, language, selectedScenarioId]
  );

  const removeSession = useCallback((sessionId) => {
    setSessionHistory((prev) =>
      prev.filter((session) => session.id !== sessionId)
    );
  }, []);

  const renameSession = useCallback((sessionId, customTitle) => {
    setSessionHistory((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? { ...session, customTitle: customTitle?.trim() || null }
          : session
      )
    );
  }, []);

  const value = {
    user,
    isLoggedIn,
    isAuthLoading,
    setUser,
    setIsLoggedIn,
    logout,
    kallpa: {
      scenarios,
      selectedScenario,
      selectedScenarioId,
      selectScenario,
      panelState,
      transcript: selectedScenario?.transcript ?? [],
      chips: selectedScenario?.chips ?? [],
      clinicalHistory: selectedScenario?.clinicalHistory ?? null,
      labs: labsState,
      attachments: selectedScenario?.attachments ?? [],
      activeVariants,
      toggleVariant,
      forceVariants,
    presetVariantsForNextScenario,
      language,
      setLanguage,
      impactProfiles,
      selectedImpactProfile,
      setSelectedImpactProfileId,
      recording,
      sessionHistory,
      startRecording,
      stopRecording,
      logRecordingEvent,
      removeSession,
      renameSession,
    },
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};
