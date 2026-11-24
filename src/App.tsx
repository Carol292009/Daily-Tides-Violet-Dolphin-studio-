import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Droplets,
  Sun,
} from 'lucide-react';
import {
  CURATED_CHALLENGES,
  CURATED_PROMPTS,
  MOOD_DEFINITIONS,
  MOTIVATION_LIBRARY,
  STORAGE_KEY,
  STUDIO_LOGO_PATH,
  buildLast30DaysHydrationSeries,
  compileWeeklySummaryLocally,
  computeConsistencyMetrics,
  createEmptyCleanState,
  evaluateBadgesLocally,
  formatVolume,
  getCompletedQuestsForDate,
  getTodayKey,
  loadPersistedState,
  reconcileForDate,
  savePersistedState,
} from './data/localStore';
import {
  downloadLocalBackupFile,
  isTimeWithinQuietHours,
  parseAndValidateDailyTideBackup,
} from './data/localBackup';
import {
  AppreciationPrompt,
  DailyQuestId,
  DailyTidePersistedState,
  GuidedReflectionResponses,
  HabitTimeOfDay,
  MotivationCategory,
  ShareCardCategory,
  UserSettings,
  WaterVessel,
} from './types/dailyTide';
import {
  OnboardingScreen,
  PersonalSetupScreen,
  SplashScreen,
} from './screens/LaunchFlowScreens';
import { HomeDashboardScreen } from './screens/HomeDashboardScreen';
import {
  HydrationTrackerScreen,
  MoodCheckInScreen,
  MotivationScreen,
  SelfReflectionJournalScreen,
} from './screens/WellnessScreens';
import {
  DailyChallengesScreen,
  HabitTrackerScreen,
} from './screens/RoutinesScreens';
import {
  AboutStudioScreen,
  AchievementCollectionScreen,
  ProgressDashboardScreen,
  RewardUnlockScreen,
  SettingsScreen,
  WeeklyRecapScreen,
} from './screens/GrowthAndStudioScreens';
import { ShareCardModal } from './components/ShareCardModal';
import { RewardedAdFlowModal } from './components/RewardedAdFlowModal';
import { OneTimeQuickGuideModal } from './components/OneTimeQuickGuideModal';
import {
  RewardAccessSnapshot,
  RewardLevelId,
  defaultRewardAccessManager,
} from './rewards/rewardAccessManager';
import { LEVEL_3_SPECIAL_CHALLENGES } from './rewards/rewardContentCatalog';
import {
  PrivacyConsentState,
  PrivacyConsentStatus,
  defaultPrivacyConsentManager,
} from './ads/privacyConsentManager';
import { AdMobSdkRewardVerifier } from './ads/rewardedAdController';

type AppRoute =
  | 'splash'
  | 'onboarding'
  | 'setup'
  | 'home'
  | 'hydration'
  | 'mood'
  | 'journal'
  | 'motivation'
  | 'habits'
  | 'challenges'
  | 'achievements'
  | 'progress'
  | 'weekly'
  | 'settings'
  | 'rewards'
  | 'about';

export default function App() {
  const [todayKey, setTodayKey] = useState<string>(() => getTodayKey());
  const [state, setState] = useState<DailyTidePersistedState>(() => loadPersistedState());
  const [route, setRoute] = useState<AppRoute>('splash');
  const [toast, setToast] = useState<string | null>(null);
  const [lastLoggedWaterId, setLastLoggedWaterId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQuickGuideModal, setShowQuickGuideModal] = useState(false);
  const [shareCategory, setShareCategory] = useState<ShareCardCategory>('achievement');
  const [shareQuoteOverride, setShareQuoteOverride] = useState<string | null>(null);
  const [rewardSnapshot, setRewardSnapshot] = useState<RewardAccessSnapshot>(() =>
    defaultRewardAccessManager.getSnapshot()
  );
  const [consentState, setConsentState] = useState<PrivacyConsentState>(() =>
    defaultPrivacyConsentManager.getState()
  );
  const [adModalState, setAdModalState] = useState<{
    open: boolean;
    mode: 'unlock' | 'consent_only';
    levelId: RewardLevelId | null;
  }>({ open: false, mode: 'unlock', levelId: null });

  const adMobVerifier = useMemo(() => new AdMobSdkRewardVerifier(), []);

  // Subscribe to independent RewardAccessManager & PrivacyConsentManager updates
  useEffect(() => {
    const unsubRewards = defaultRewardAccessManager.subscribe((snap) => {
      setRewardSnapshot(snap);
    });
    const unsubConsent = defaultPrivacyConsentManager.subscribe((consent) => {
      setConsentState(consent);
    });
    return () => {
      unsubRewards();
      unsubConsent();
    };
  }, []);

  // Live 1-second countdown & automatic expiration timer while any reward level is active
  useEffect(() => {
    if (rewardSnapshot.unlockedLevelIds.length === 0) return;
    const tickId = window.setInterval(() => {
      setRewardSnapshot(defaultRewardAccessManager.getSnapshot());
    }, 1000);
    return () => window.clearInterval(tickId);
  }, [rewardSnapshot.unlockedLevelIds.length]);

  // Automatic daily reset observer (detects midnight rollover or returning the next morning)
  useEffect(() => {
    const syncDateRollover = () => {
      setRewardSnapshot(defaultRewardAccessManager.getSnapshot());
      const latestKey = getTodayKey();
      setTodayKey((prevKey) => {
        if (prevKey !== latestKey) {
          setLastLoggedWaterId(null);
          setState((prev) => reconcileForDate(prev, latestKey));
          return latestKey;
        }
        return prevKey;
      });
    };

    const intervalId = window.setInterval(syncDateRollover, 30_000);
    window.addEventListener('focus', syncDateRollover);
    document.addEventListener('visibilitychange', syncDateRollover);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncDateRollover);
      document.removeEventListener('visibilitychange', syncDateRollover);
    };
  }, []);

  // Offline local persistence (survives refresh, closing app, reboot, and airplane mode)
  useEffect(() => {
    savePersistedState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.themeMode === 'MIDNIGHT_TIDE') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.themeMode]);

  // Local quiet-hours-aware in-session reminder check (only runs if user enabled reminders & granted permission)
  useEffect(() => {
    const sched = state.settings.reminderSchedule;
    const anyEnabled =
      sched.water.enabled ||
      sched.reflection.enabled ||
      sched.habits.enabled ||
      sched.selfCareCheckIn.enabled ||
      sched.dailyUse.enabled;
    if (!anyEnabled) return;

    const lastSentByType: Record<string, string> = {};
    const checkLocalReminders = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hh}:${mm}`;
      if (
        isTimeWithinQuietHours(
          currentHHMM,
          state.settings.quietHoursStart,
          state.settings.quietHoursEnd
        )
      ) {
        return;
      }

      const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
      const dayNumber = Math.floor(now.getTime() / 86_400_000);
      const matchesFreq = (freq: string) =>
        freq === 'DAILY' ||
        freq === 'TWICE_DAILY' ||
        (freq === 'WEEKDAYS' && isWeekday) ||
        (freq === 'EVERY_2_DAYS' && dayNumber % 2 === 0) ||
        (freq === 'WEEKLY' && dayOfWeek === 0);

      const maybeNotify = (key: string, title: string, body: string) => {
        const stamp = `${getTodayKey()}_${currentHHMM}`;
        if (lastSentByType[key] === stamp) return;
        lastSentByType[key] = stamp;
        try {
          new Notification(title, { body, silent: false });
        } catch {
          // Ignore notification construction failure in restricted iframe contexts
        }
      };

      if (
        sched.reflection.enabled &&
        matchesFreq(sched.reflection.frequency) &&
        currentHHMM === sched.reflection.preferredTime
      ) {
        maybeNotify(
          'reflection',
          'Daily Tide · Reflection',
          'Take five quiet minutes for your private reflection journal.'
        );
      }

      if (
        sched.habits.enabled &&
        matchesFreq(sched.habits.frequency) &&
        currentHHMM === sched.habits.preferredTime
      ) {
        maybeNotify(
          'habits',
          'Daily Tide · Little Habits',
          'Check in gently with your personal habits at your own pace.'
        );
      }

      if (
        sched.selfCareCheckIn.enabled &&
        matchesFreq(sched.selfCareCheckIn.frequency) &&
        currentHHMM === sched.selfCareCheckIn.preferredTime
      ) {
        maybeNotify(
          'selfCare',
          'Daily Tide · Self-Care Check-In',
          'Pause for a slow breath and notice how your tide feels today.'
        );
      }

      if (
        sched.dailyUse.enabled &&
        currentHHMM === sched.dailyUse.preferredTime
      ) {
        maybeNotify(
          'dailyUse',
          'Daily Tide · Your Calm Check-In Awaits',
          'Ready for a gentle sip of water, a mood check-in, or one small habit today?'
        );
      }
    };

    const timerId = window.setInterval(checkLocalReminders, 60_000);
    return () => window.clearInterval(timerId);
  }, [state.settings.quietHoursEnd, state.settings.quietHoursStart, state.settings.reminderSchedule]);

  // One-time polite post-use feedback notification when user leaves tab after completing onboarding & logging at least one action
  useEffect(() => {
    const fb = state.settings.reminderSchedule.postUseFeedback;
    const hasUsedApp =
      state.waterLogs.length > 0 ||
      state.moodCheckIns.length > 0 ||
      state.journalEntries.length > 0 ||
      state.habits.length > 0;
    if (!state.settings.hasCompletedOnboarding || !fb.enabled || fb.hasBeenSent || !hasUsedApp) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      if (
        isTimeWithinQuietHours(
          currentHHMM,
          state.settings.quietHoursStart,
          state.settings.quietHoursEnd
        )
      ) {
        return;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('How is Daily Tide feeling so far?', {
            body: 'Thank you for spending time with Daily Tide. Your feedback helps Violet Dolphin Studio grow.',
          });
        } catch {
          // Ignore restricted notification contexts
        }
        setState((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            reminderSchedule: {
              ...prev.settings.reminderSchedule,
              postUseFeedback: {
                ...prev.settings.reminderSchedule.postUseFeedback,
                hasBeenSent: true,
              },
            },
          },
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [
    state.habits.length,
    state.journalEntries.length,
    state.moodCheckIns.length,
    state.settings.hasCompletedOnboarding,
    state.settings.quietHoursEnd,
    state.settings.quietHoursStart,
    state.settings.reminderSchedule.postUseFeedback,
    state.waterLogs.length,
  ]);

  const notify = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const commitState = (
    updater: (prev: DailyTidePersistedState) => DailyTidePersistedState,
    reevaluateBadges = true
  ) => {
    setState((prev) => {
      const next = updater(prev);
      return reevaluateBadges
        ? { ...next, badges: evaluateBadgesLocally(next) }
        : next;
    });
  };

  const navigate = (nextRoute: AppRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Derived data keyed to active todayKey (automatically resets daily view while keeping full history)
  const todayWaterLogs = useMemo(
    () =>
      state.waterLogs
        .filter((l) => l.dateKey === todayKey)
        .sort((a, b) => b.loggedAtMillis - a.loggedAtMillis),
    [state.waterLogs, todayKey]
  );

  const todayConsumedMl = useMemo(
    () => todayWaterLogs.reduce((sum, l) => sum + l.amountMl, 0),
    [todayWaterLogs]
  );

  const latestTodayMood = useMemo(
    () =>
      state.moodCheckIns
        .filter((m) => m.dateKey === todayKey)
        .sort((a, b) => b.createdAtMillis - a.createdAtMillis)[0] ?? null,
    [state.moodCheckIns, todayKey]
  );

  const todayAffirmation = useMemo(() => {
    const preferredCategory: MotivationCategory =
      latestTodayMood?.moodLevel === 1 || latestTodayMood?.moodLevel === 2
        ? 'New beginnings'
        : latestTodayMood?.moodLevel === 3
        ? 'Consistency'
        : latestTodayMood?.moodLevel === 5
        ? 'Gratitude'
        : 'Positive thinking';
    const pool = MOTIVATION_LIBRARY.filter((a) => a.toneCategory === preferredCategory);
    const daySeed = Number(todayKey.replace(/-/g, '')) || new Date().getDate();
    const chosen = (pool.length ? pool : MOTIVATION_LIBRARY)[
      daySeed % (pool.length || MOTIVATION_LIBRARY.length)
    ];
    return {
      ...chosen,
      isFavorite: state.favoriteAffirmationIds.includes(chosen.id),
    };
  }, [latestTodayMood, state.favoriteAffirmationIds, todayKey]);

  const activeChallenge = useMemo(
    () =>
      [...CURATED_CHALLENGES, ...LEVEL_3_SPECIAL_CHALLENGES].find(
        (c) => c.id === state.dailyChallenge.challengeId
      ) ?? CURATED_CHALLENGES[0],
    [state.dailyChallenge.challengeId]
  );

  const rewardLevelMap = useMemo(() => {
    const map = new Map(rewardSnapshot.levels.map((lvl) => [lvl.config.id, lvl]));
    return {
      level1: map.get('level_1_special_motivation')!,
      level2: map.get('level_2_advanced_reflection')!,
      level3: map.get('level_3_special_challenges')!,
      level4: map.get('level_4_visual_themes')!,
      level5: map.get('level_5_personal_bmi_hydration')!,
    };
  }, [rewardSnapshot]);

  const todayPrompt = useMemo(
    () =>
      CURATED_PROMPTS[
        (new Date().getDate() + state.promptIndexOffset) % CURATED_PROMPTS.length
      ],
    [state.promptIndexOffset]
  );

  const completedQuestIds = useMemo(
    () => getCompletedQuestsForDate(state, todayKey),
    [state, todayKey]
  );

  const consistency = useMemo(
    () => computeConsistencyMetrics(state, todayKey),
    [state, todayKey]
  );

  const last7DaysData = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const key = getTodayKey(-(6 - i));
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const ml = state.waterLogs
          .filter((l) => l.dateKey === key)
          .reduce((s, l) => s + l.amountMl, 0);
        const label = d.toLocaleDateString(undefined, { weekday: 'narrow' });
        return { key, label, ml };
      }),
    [state.waterLogs, todayKey]
  );

  const last30DaysData = useMemo(
    () =>
      buildLast30DaysHydrationSeries(
        state.waterLogs,
        state.settings.dailyWaterGoalMl,
        todayKey
      ),
    [state.waterLogs, state.settings.dailyWaterGoalMl, todayKey]
  );

  // Action handlers
  const handleQuickAddWater = (vessel: WaterVessel) => {
    const newId = `wl_${Date.now()}`;
    commitState((prev) => ({
      ...prev,
      waterLogs: [
        {
          id: newId,
          dateKey: todayKey,
          loggedAtMillis: Date.now(),
          amountMl: vessel.volumeMl,
          vesselName: vessel.name,
        },
        ...prev.waterLogs,
      ],
    }));
    setLastLoggedWaterId(newId);
    notify(`Logged +${formatVolume(vessel.volumeMl, state.settings.unit)} (${vessel.name}).`);
  };

  const handleLogCustomWater = (amountMl: number, label: string) => {
    const newId = `wl_${Date.now()}`;
    commitState((prev) => ({
      ...prev,
      waterLogs: [
        {
          id: newId,
          dateKey: todayKey,
          loggedAtMillis: Date.now(),
          amountMl,
          vesselName: label,
        },
        ...prev.waterLogs,
      ],
    }));
    setLastLoggedWaterId(newId);
    notify(`Logged +${formatVolume(amountMl, state.settings.unit)} (${label}).`);
  };

  const handleUndoWater = () => {
    if (!lastLoggedWaterId) return;
    commitState((prev) => ({
      ...prev,
      waterLogs: prev.waterLogs.filter((l) => l.id !== lastLoggedWaterId),
    }));
    setLastLoggedWaterId(null);
    notify('Removed last sip.');
  };

  const handleAddVessel = (name: string, volumeMl: number) => {
    commitState(
      (prev) => ({
        ...prev,
        vessels: [
          ...prev.vessels,
          { id: `v_${Date.now()}`, name, volumeMl, isDefault: false },
        ],
      }),
      false
    );
    notify(`Added custom glass "${name}".`);
  };

  const handleSaveMood = (level: 1 | 2 | 3 | 4 | 5, tags: string[], note: string) => {
    commitState((prev) => ({
      ...prev,
      moodCheckIns: [
        {
          id: `mc_${Date.now()}`,
          dateKey: todayKey,
          createdAtMillis: Date.now(),
          moodLevel: level,
          tags,
          note,
        },
        ...prev.moodCheckIns,
      ],
    }));
    const label = MOOD_DEFINITIONS.find((m) => m.level === level)?.label ?? 'Steady';
    notify(`Mood check-in saved (${label}).`);
  };

  const handleDeleteMood = (id: string) => {
    commitState(
      (prev) => ({
        ...prev,
        moodCheckIns: prev.moodCheckIns.filter((m) => m.id !== id),
      }),
      false
    );
    notify('Mood entry removed.');
  };

  const handleSaveJournal = (
    title: string,
    body: string,
    guidedResponses?: GuidedReflectionResponses,
    editId?: string
  ) => {
    if (editId) {
      commitState(
        (prev) => ({
          ...prev,
          journalEntries: prev.journalEntries.map((entry) =>
            entry.id === editId
              ? { ...entry, title, body, guidedResponses }
              : entry
          ),
        }),
        false
      );
      notify('Reflection updated locally.');
    } else {
      commitState((prev) => ({
        ...prev,
        journalEntries: [
          {
            id: `je_${Date.now()}`,
            dateKey: todayKey,
            createdAtMillis: Date.now(),
            title,
            body,
            moodLevel: latestTodayMood?.moodLevel,
            guidedResponses,
          },
          ...prev.journalEntries,
        ],
      }));
      notify('Reflection saved privately — your Progress Garden gained +20 pts.');
    }
  };

  const handleSaveAppreciation = (prompt: AppreciationPrompt, answerText: string) => {
    commitState((prev) => ({
      ...prev,
      appreciationAnswers: [
        {
          id: `aa_${Date.now()}`,
          dateKey: todayKey,
          promptId: prompt.id,
          promptText: prompt.promptText,
          answerText,
          createdAtMillis: Date.now(),
        },
        ...prev.appreciationAnswers,
      ],
    }));
    notify('Saved to your Self-Appreciation Vault.');
  };

  const handleDeleteAppreciation = (id: string) => {
    commitState(
      (prev) => ({
        ...prev,
        appreciationAnswers: prev.appreciationAnswers.filter((a) => a.id !== id),
      }),
      false
    );
    notify('Removed entry from Appreciation Vault.');
  };

  const handleToggleHabit = (habitId: string) => {
    commitState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId || h.isPaused) return h;
        const done = h.completedDates.includes(todayKey);
        return {
          ...h,
          completedDates: done
            ? h.completedDates.filter((d) => d !== todayKey)
            : [...h.completedDates, todayKey],
        };
      }),
    }));
  };

  const handleCreateHabit = (title: string, description: string, timeOfDay: HabitTimeOfDay) => {
    commitState(
      (prev) => ({
        ...prev,
        habits: [
          ...prev.habits,
          {
            id: `hb_${Date.now()}`,
            title,
            description,
            timeOfDay,
            isPaused: false,
            completedDates: [],
          },
        ],
      }),
      false
    );
    notify(`Added habit "${title}".`);
  };

  const handleEditHabit = (
    id: string,
    title: string,
    description: string,
    timeOfDay: HabitTimeOfDay
  ) => {
    commitState(
      (prev) => ({
        ...prev,
        habits: prev.habits.map((h) =>
          h.id === id ? { ...h, title, description, timeOfDay } : h
        ),
      }),
      false
    );
    notify(`Updated habit "${title}".`);
  };

  const handleToggleQuest = (questId: DailyQuestId) => {
    commitState((prev) => {
      const currentList = prev.questHistory?.[todayKey] ?? [];
      const exists = currentList.includes(questId);
      const nextList = exists
        ? currentList.filter((id) => id !== questId)
        : [...currentList, questId];
      return {
        ...prev,
        questHistory: {
          ...(prev.questHistory ?? {}),
          [todayKey]: nextList,
        },
      };
    });
  };

  const handleSavePositiveThought = (text: string) => {
    commitState((prev) => {
      const currentList = prev.questHistory?.[todayKey] ?? [];
      const nextList = currentList.includes('positive_thought')
        ? currentList
        : [...currentList, 'positive_thought' as DailyQuestId];
      return {
        ...prev,
        positiveThoughts: [
          {
            id: `pt_${Date.now()}`,
            dateKey: todayKey,
            text,
            createdAtMillis: Date.now(),
          },
          ...(prev.positiveThoughts ?? []),
        ],
        questHistory: {
          ...(prev.questHistory ?? {}),
          [todayKey]: nextList,
        },
      };
    });
    notify('Positive thought saved — +20 Tide Points for your garden.');
  };

  const handleDeletePositiveThought = (id: string) => {
    commitState(
      (prev) => ({
        ...prev,
        positiveThoughts: (prev.positiveThoughts ?? []).filter((pt) => pt.id !== id),
      }),
      false
    );
    notify('Positive thought deleted.');
  };

  const handleDeleteWaterLog = (id: string) => {
    commitState((prev) => ({
      ...prev,
      waterLogs: prev.waterLogs.filter((l) => l.id !== id),
    }));
    if (lastLoggedWaterId === id) setLastLoggedWaterId(null);
    notify('Water entry removed.');
  };

  const handleDeleteJournal = (id: string) => {
    commitState(
      (prev) => ({
        ...prev,
        journalEntries: prev.journalEntries.filter((e) => e.id !== id),
      }),
      false
    );
    notify('Reflection deleted.');
  };

  const handleDeleteHabit = (id: string) => {
    commitState(
      (prev) => ({
        ...prev,
        habits: prev.habits.filter((h) => h.id !== id),
      }),
      false
    );
    notify('Habit removed.');
  };

  const handleExportLocalData = () => {
    const filename = downloadLocalBackupFile(state);
    notify(`Exported offline backup (${filename}) to your device.`);
  };

  const handleImportLocalData = (rawJson: string) => {
    const result = parseAndValidateDailyTideBackup(rawJson);
    if (!result.ok) {
      notify(`Import failed: ${result.error}`);
      return;
    }
    setState(result.state);
    setLastLoggedWaterId(null);
    const { waterLogs, journalEntries, moodCheckIns, habits } = result.summary;
    notify(
      `Imported backup locally (${waterLogs} water, ${moodCheckIns} moods, ${journalEntries} journal, ${habits} habits).`
    );
  };

  const handleClearAllApplicationData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
    defaultRewardAccessManager.clearAllRewardData();
    defaultPrivacyConsentManager.resetConsent();
    const clean = createEmptyCleanState();
    setState(clean);
    setLastLoggedWaterId(null);
    navigate('onboarding');
    notify('All local application data & reward records cleared. Reminders cancelled.');
  };

  const handleRestartFreshTide = () => {
    commitState(
      (prev) => ({
        ...prev,
        streakRestartedFromDateKey: todayKey,
      }),
      false
    );
    notify('Started a Fresh Tide today — all historical badges, points, and garden blooms remain safely yours.');
  };

  const handleToggleAffirmationFavorite = (affirmationId: string) => {
    commitState(
      (prev) => {
        const exists = prev.favoriteAffirmationIds.includes(affirmationId);
        return {
          ...prev,
          favoriteAffirmationIds: exists
            ? prev.favoriteAffirmationIds.filter((id) => id !== affirmationId)
            : [...prev.favoriteAffirmationIds, affirmationId],
        };
      },
      false
    );
  };

  const handleCompleteChallenge = () => {
    commitState((prev) => ({
      ...prev,
      dailyChallenge: { ...prev.dailyChallenge, dateKey: todayKey, status: 'COMPLETED' },
    }));
    notify('Bonus calm ritual completed (+20 Tide Points).');
  };

  const handleSwapChallenge = (useMockReward: boolean) => {
    const idx = CURATED_CHALLENGES.findIndex((c) => c.id === state.dailyChallenge.challengeId);
    const nextChallenge = CURATED_CHALLENGES[(idx + 1) % CURATED_CHALLENGES.length];
    commitState(
      (prev) => ({
        ...prev,
        dailyChallenge: {
          dateKey: todayKey,
          challengeId: nextChallenge.id,
          status: 'ASSIGNED',
          swapsUsed: prev.dailyChallenge.swapsUsed + 1,
        },
      }),
      false
    );
    notify(useMockReward ? 'Challenge refreshed (Reward).' : 'Refreshed today’s bonus ritual.');
  };

  const handleUpdateSettings = (partial: Partial<UserSettings>) => {
    commitState(
      (prev) => ({
        ...prev,
        settings: { ...prev.settings, ...partial },
      }),
      false
    );
  };

  const handleOpenOptionalAdUnlock = (levelId: RewardLevelId) => {
    setAdModalState({ open: true, mode: 'unlock', levelId });
  };

  const handleOpenPrivacyConsentModal = () => {
    setAdModalState({ open: true, mode: 'consent_only', levelId: null });
  };

  const handleSetConsentChoice = (choice: Exclude<PrivacyConsentStatus, 'UNKNOWN'>) => {
    defaultPrivacyConsentManager.setConsentChoice(choice);
    notify(
      choice === 'DECLINED'
        ? 'Ad privacy saved: ads declined — all Free Level features remain active.'
        : 'Ad privacy consent saved locally.'
    );
  };

  const handleRewardEarnedGrant = async (levelId: RewardLevelId) => {
    const result = await defaultRewardAccessManager.completeRewardUnlock(
      levelId,
      adMobVerifier
    );
    if (!result.ok || !result.grant) {
      return { ok: false, error: result.error ?? 'Could not save reward grant.' };
    }
    const lvl = defaultRewardAccessManager.getLevelSnapshot(levelId);
    notify(
      `${lvl.config.badgeLabel} (${lvl.config.title}) unlocked for ${lvl.config.durationHours}h — saved locally for offline access.`
    );
    return { ok: true, expiresAtMillis: result.grant.expiresAtMillis };
  };

  const handleExpireLevelNowForTesting = (levelId: RewardLevelId) => {
    defaultRewardAccessManager.expireLevelNowForTesting(levelId);
    const lvl = defaultRewardAccessManager.getLevelSnapshot(levelId);
    notify(`${lvl.config.badgeLabel} (${lvl.config.title}) expired and re-locked.`);
  };

  const openShareCard = (
    category: ShareCardCategory = 'achievement',
    customQuote?: string
  ) => {
    if (category === 'weekly') {
      commitState(
        (prev) => ({ ...prev, weeklySummary: compileWeeklySummaryLocally(prev) }),
        false
      );
    }
    setShareCategory(category);
    setShareQuoteOverride(customQuote ?? null);
    setShowShareModal(true);
  };

  // Full-screen Launch Flow Screens (1. Splash -> 2. Ask User Name First -> 3. Optional Setup)
  if (route === 'splash') {
    const needsNameFirst =
      !state.settings.hasCompletedOnboarding || !state.settings.displayName.trim();
    return (
      <SplashScreen
        onContinue={() => navigate(needsNameFirst ? 'onboarding' : 'home')}
      />
    );
  }

  if (route === 'onboarding') {
    return (
      <OnboardingScreen
        initialName={state.settings.displayName}
        onQuickEnterDashboard={(enteredName) => {
          commitState(
            (prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                displayName: enteredName,
                hasCompletedOnboarding: true,
              },
            }),
            false
          );
          navigate('home');
          notify(`Welcome to Daily Tide, ${enteredName}.`);
        }}
        onContinueToSetup={(enteredName) => {
          commitState(
            (prev) => ({
              ...prev,
              settings: {
                ...prev.settings,
                displayName: enteredName,
              },
            }),
            false
          );
          navigate('setup');
        }}
      />
    );
  }

  if (route === 'setup') {
    return (
      <PersonalSetupScreen
        initialName={state.settings.displayName}
        initialUnit={state.settings.unit}
        initialGoalMl={state.settings.dailyWaterGoalMl}
        initialReminders={state.settings.remindersEnabled}
        onFinish={({ displayName, unit, dailyWaterGoalMl, remindersEnabled, starterHabits }) => {
          commitState((prev) => {
            const existingTitles = new Set(prev.habits.map((h) => h.title));
            const addedHabits = starterHabits
              .filter((t) => !existingTitles.has(t))
              .map((t, idx) => ({
                id: `hb_setup_${Date.now()}_${idx}`,
                title: t,
                description: 'Gentle everyday self-care ritual.',
                timeOfDay: (idx === 0 ? 'Morning' : idx === 1 ? 'Afternoon' : 'Evening') as HabitTimeOfDay,
                isPaused: false,
                completedDates: [],
              }));
            return {
              ...prev,
              settings: {
                ...prev.settings,
                hasCompletedOnboarding: true,
                displayName,
                unit,
                dailyWaterGoalMl,
                remindersEnabled,
                reminderSchedule: {
                  ...prev.settings.reminderSchedule,
                  water: {
                    ...prev.settings.reminderSchedule.water,
                    enabled: remindersEnabled,
                  },
                },
              },
              habits: [...prev.habits, ...addedHabits],
            };
          });
          navigate('home');
          notify(`Welcome to Daily Tide, ${displayName}.`);
        }}
      />
    );
  }

  // Determine top nav highlight for nested routes
  const topNavActive: AppRoute =
    route === 'hydration' || route === 'mood' || route === 'motivation'
      ? 'home'
      : route === 'challenges'
      ? 'habits'
      : route === 'achievements' || route === 'weekly'
      ? 'progress'
      : route === 'rewards' || route === 'about'
      ? 'settings'
      : route;

  return (
    <div className="min-h-screen bg-[#FAF8F4] dark:bg-[#111322] text-[#1F1D2B] dark:text-[#F3F0EA] transition-colors pb-24 md:pb-14">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-[#E6DFD3] dark:border-[#252A44] bg-[#FAF8F4]/90 dark:bg-[#111322]/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-[#1E1340] dark:text-[#F3F0EA] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <img
              src={STUDIO_LOGO_PATH}
              alt="Daily Tide"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-xl object-cover border border-[#E6DFD3] dark:border-[#2C3250] shadow-xs"
            />
            <span>Daily Tide</span>
          </button>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {(
              [
                ['home', 'Home'],
                ['hydration', 'Hydration'],
                ['habits', 'Habits'],
                ['journal', 'Reflect'],
                ['progress', 'Garden & Progress'],
              ] as [AppRoute, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  route === id || (id !== 'hydration' && topNavActive === id)
                    ? 'border-[#6C4FE0] text-[#1E1340] dark:text-white'
                    : 'border-transparent text-[#645F75] dark:text-[#B3AEC4] hover:text-[#1E1340] dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => navigate(route === 'settings' ? 'home' : 'settings')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1E1340] dark:bg-[#6C4FE0] text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 cursor-pointer"
            >
              {route === 'settings' ? 'Home' : 'Settings'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-6 pt-7">
        {toast && (
          <div
            role="status"
            className="mb-5 flex items-center justify-between gap-4 rounded-2xl bg-[#EFEAFF] dark:bg-[#2E235C] px-4 py-3 text-sm text-[#1E1340] dark:text-[#F3F0EA]"
          >
            <span>{toast}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-semibold text-[#6C4FE0] dark:text-[#A994FF] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {/* 4. HOME DASHBOARD */}
            {route === 'home' && (
              <HomeDashboardScreen
                todayKey={todayKey}
                displayName={state.settings.displayName}
                unit={state.settings.unit}
                consumedMl={todayConsumedMl}
                goalMl={state.settings.dailyWaterGoalMl}
                vessels={state.vessels}
                canUndoWater={lastLoggedWaterId !== null}
                latestTodayMood={latestTodayMood}
                todayAffirmation={todayAffirmation}
                completedQuestIds={completedQuestIds}
                consistency={consistency}
                todayPrompt={todayPrompt}
                habits={state.habits}
                badges={state.badges}
                onQuickAddWater={handleQuickAddWater}
                onUndoWater={handleUndoWater}
                onToggleHabit={handleToggleHabit}
                onToggleQuest={handleToggleQuest}
                onToggleAffirmationFavorite={handleToggleAffirmationFavorite}
                onNavigate={(dest) => {
                  if (dest === 'weekly') {
                    commitState(
                      (prev) => ({ ...prev, weeklySummary: compileWeeklySummaryLocally(prev) }),
                      false
                    );
                  }
                  navigate(dest);
                }}
                onOpenShareCard={(mode) => openShareCard(mode ?? 'achievement')}
              />
            )}

            {/* 5. HYDRATION TRACKER */}
            {route === 'hydration' && (
              <HydrationTrackerScreen
                todayKey={todayKey}
                consumedMl={todayConsumedMl}
                goalMl={state.settings.dailyWaterGoalMl}
                unit={state.settings.unit}
                vessels={state.vessels}
                allWaterLogs={state.waterLogs}
                todayLogs={todayWaterLogs}
                canUndo={lastLoggedWaterId !== null}
                bodyMetrics={state.settings.bodyMetrics}
                bmiHydrationAccess={rewardLevelMap.level5}
                onChangeUnit={(nextUnit) => {
                  handleUpdateSettings({ unit: nextUnit });
                  notify(
                    `Hydration unit switched to ${
                      nextUnit === 'L' ? 'Litres (L)' : nextUnit === 'OZ' ? 'Fluid Ounces (oz)' : 'Milliliters (ml)'
                    }.`
                  );
                }}
                onSaveBodyMetrics={(bodyMetrics) => {
                  handleUpdateSettings({ bodyMetrics });
                }}
                onRequestUnlockBmiGuide={() =>
                  handleOpenOptionalAdUnlock('level_5_personal_bmi_hydration')
                }
                onQuickAdd={handleQuickAddWater}
                onLogCustomAmount={handleLogCustomWater}
                onUndo={handleUndoWater}
                onDeleteLog={handleDeleteWaterLog}
                onAddVessel={handleAddVessel}
                onDeleteVessel={(id) => {
                  commitState(
                    (prev) => ({
                      ...prev,
                      vessels: prev.vessels.filter((v) => v.id !== id),
                    }),
                    false
                  );
                  notify('Custom glass removed.');
                }}
                onUpdateGoal={(goalMl) => {
                  handleUpdateSettings({ dailyWaterGoalMl: goalMl });
                  notify(`Personal water target updated to ${formatVolume(goalMl, state.settings.unit)}.`);
                }}
                onBack={() => navigate('home')}
              />
            )}

            {/* 6. MOOD CHECK-IN */}
            {route === 'mood' && (
              <MoodCheckInScreen
                todayKey={todayKey}
                moodCheckIns={state.moodCheckIns}
                onSaveMood={handleSaveMood}
                onDeleteMood={handleDeleteMood}
                onBack={() => navigate('home')}
              />
            )}

            {/* 7. DAILY REFLECTION & SELF-APPRECIATION */}
            {route === 'journal' && (
              <SelfReflectionJournalScreen
                todayKey={todayKey}
                entries={state.journalEntries}
                appreciations={state.appreciationAnswers}
                todayPrompt={todayPrompt}
                advancedReflectionAccess={rewardLevelMap.level2}
                onSaveJournal={handleSaveJournal}
                onDeleteJournal={handleDeleteJournal}
                onSaveAppreciation={handleSaveAppreciation}
                onDeleteAppreciation={handleDeleteAppreciation}
                onSwapPrompt={() =>
                  commitState(
                    (prev) => ({ ...prev, promptIndexOffset: prev.promptIndexOffset + 1 }),
                    false
                  )
                }
                onOpenRewardUnlock={() => navigate('rewards')}
              />
            )}

            {/* 8. MOTIVATION LIBRARY (105 OFFLINE MESSAGES, 7 CATEGORIES) */}
            {route === 'motivation' && (
              <MotivationScreen
                favoriteAffirmationIds={state.favoriteAffirmationIds}
                specialMotivationAccess={rewardLevelMap.level1}
                onToggleFavorite={handleToggleAffirmationFavorite}
                onShareQuote={(quoteText) => openShareCard('motivation', quoteText)}
                onOpenRewardUnlock={() => navigate('rewards')}
                onBack={() => navigate('home')}
              />
            )}

            {/* 9. HABIT TRACKER */}
            {route === 'habits' && (
              <HabitTrackerScreen
                todayKey={todayKey}
                habits={state.habits}
                onToggleHabit={handleToggleHabit}
                onCreateHabit={handleCreateHabit}
                onEditHabit={handleEditHabit}
                onTogglePause={(id) =>
                  commitState(
                    (prev) => ({
                      ...prev,
                      habits: prev.habits.map((h) =>
                        h.id === id ? { ...h, isPaused: !h.isPaused } : h
                      ),
                    }),
                    false
                  )
                }
                onDeleteHabit={handleDeleteHabit}
              />
            )}

            {/* 10. DAILY SELF-CARE QUESTS & CALM RITUALS */}
            {route === 'challenges' && (
              <DailyChallengesScreen
                todayKey={todayKey}
                completedQuestIds={completedQuestIds}
                todayPoints={consistency.todayPoints}
                gardenStage={consistency.gardenStage}
                positiveThoughts={state.positiveThoughts ?? []}
                activeChallenge={activeChallenge}
                dailyChallenge={state.dailyChallenge}
                specialChallengesAccess={rewardLevelMap.level3}
                onToggleQuest={handleToggleQuest}
                onSavePositiveThought={handleSavePositiveThought}
                onDeletePositiveThought={handleDeletePositiveThought}
                onOpenLinkedRoute={(dest) => navigate(dest)}
                onCompleteChallenge={handleCompleteChallenge}
                onSwapChallenge={handleSwapChallenge}
                onPickChallenge={(challengeId) => {
                  commitState(
                    (prev) => ({
                      ...prev,
                      dailyChallenge: {
                        dateKey: todayKey,
                        challengeId,
                        status: 'ASSIGNED',
                        swapsUsed: prev.dailyChallenge.swapsUsed,
                      },
                    }),
                    false
                  );
                  notify('Updated today’s bonus calm ritual.');
                }}
                onOpenRewardUnlock={() => navigate('rewards')}
                onBack={() => navigate('home')}
              />
            )}

            {/* 11. ACHIEVEMENT COLLECTION */}
            {route === 'achievements' && (
              <AchievementCollectionScreen
                badges={state.badges}
                onOpenShareCard={(mode) => openShareCard(mode ?? 'achievement')}
                onBack={() => navigate('progress')}
              />
            )}

            {/* 12. PROGRESS GARDEN & CONSISTENCY DASHBOARD */}
            {route === 'progress' && (
              <ProgressDashboardScreen
                consistency={consistency}
                last7Days={last7DaysData}
                last30Days={last30DaysData}
                dailyGoalMl={state.settings.dailyWaterGoalMl}
                unit={state.settings.unit}
                badges={state.badges}
                weeklySummary={state.weeklySummary}
                onRestartFreshTide={handleRestartFreshTide}
                onOpenWeeklyRecap={() => {
                  commitState(
                    (prev) => ({ ...prev, weeklySummary: compileWeeklySummaryLocally(prev) }),
                    false
                  );
                  navigate('weekly');
                }}
                onOpenAchievements={() => navigate('achievements')}
                onOpenQuests={() => navigate('challenges')}
                onOpenShareCard={(mode) => openShareCard(mode ?? 'milestone')}
              />
            )}

            {/* 13. WEEKLY RECAP (5 PILLARS) */}
            {route === 'weekly' && (
              <WeeklyRecapScreen
                weeklySummary={state.weeklySummary}
                unit={state.settings.unit}
                onCompileWeekly={() => {
                  commitState(
                    (prev) => ({ ...prev, weeklySummary: compileWeeklySummaryLocally(prev) }),
                    false
                  );
                  notify('Weekly Tide recap compiled locally.');
                }}
                onOpenShareCard={(mode) => openShareCard(mode ?? 'weekly')}
                onBack={() => navigate('progress')}
              />
            )}

            {/* 14. SETTINGS */}
            {route === 'settings' && (
              <SettingsScreen
                state={state}
                settings={state.settings}
                rewardSnapshot={rewardSnapshot}
                onUpdateSettings={(partial) => {
                  handleUpdateSettings(partial);
                  notify('Preferences saved locally.');
                }}
                onExportLocalData={handleExportLocalData}
                onImportLocalData={handleImportLocalData}
                onDeleteWaterLog={handleDeleteWaterLog}
                onDeleteMood={handleDeleteMood}
                onDeleteJournal={handleDeleteJournal}
                onDeleteAppreciation={handleDeleteAppreciation}
                onDeleteHabit={handleDeleteHabit}
                onDeletePositiveThought={handleDeletePositiveThought}
                onClearAllApplicationData={handleClearAllApplicationData}
                onOpenRewardUnlock={() => navigate('rewards')}
                onOpenAboutStudio={() => navigate('about')}
                onReplaySplash={() => navigate('splash')}
                onReplayOnboarding={() => navigate('onboarding')}
                onReplayQuickGuide={() => {
                  navigate('home');
                  setShowQuickGuideModal(true);
                }}
              />
            )}

            {/* 15. REWARDED ACCESS MANAGER (GOOGLE ADMOB REWARDED ADS) */}
            {route === 'rewards' && (
              <RewardUnlockScreen
                rewardSnapshot={rewardSnapshot}
                consentState={consentState}
                onRequestOptionalAdUnlock={handleOpenOptionalAdUnlock}
                onOpenPrivacyConsent={handleOpenPrivacyConsentModal}
                onExpireLevelNowForTesting={handleExpireLevelNowForTesting}
                onOpenRewardFeature={(dest) => {
                  if (dest === 'share') {
                    openShareCard('achievement');
                  } else {
                    navigate(dest);
                  }
                }}
                onBack={() => navigate('settings')}
              />
            )}

            {/* 16. ABOUT VIOLET DOLPHIN STUDIO */}
            {route === 'about' && (
              <AboutStudioScreen onBack={() => navigate('settings')} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation Bar (5 clean thumb-zone tabs) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t border-[#E6DFD3] dark:border-[#252A44] bg-white/95 dark:bg-[#141729]/95 backdrop-blur-md grid grid-cols-5 items-center"
      >
        {(
          [
            ['home', 'Home', Sun],
            ['hydration', 'Water', Droplets],
            ['habits', 'Habits', CheckCircle2],
            ['journal', 'Reflect', BookOpen],
            ['progress', 'Garden', Award],
          ] as const
        ).map(([id, label, IconComp]) => {
          const active = route === id || (id !== 'hydration' && topNavActive === id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                active
                  ? 'text-[#6C4FE0] dark:text-[#A994FF]'
                  : 'text-[#645F75] dark:text-[#B3AEC4]'
              }`}
            >
              <IconComp className="w-5 h-5" />
              <span className="mt-0.5 text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4-Mode Privacy-Safe Shareable Card Studio Modal */}
      {showShareModal && (
        <ShareCardModal
          initialCategory={shareCategory}
          initialQuoteText={shareQuoteOverride}
          displayName={state.settings.displayName}
          unit={state.settings.unit}
          hydrationSummary={`${formatVolume(todayConsumedMl, state.settings.unit)} today`}
          todayAffirmationText={todayAffirmation.text}
          badges={state.badges}
          consistency={consistency}
          weeklySummary={state.weeklySummary}
          visualThemesAccess={rewardLevelMap.level4}
          onRequestUnlockVisualThemes={() =>
            handleOpenOptionalAdUnlock('level_4_visual_themes')
          }
          onClose={() => {
            setShowShareModal(false);
            setShareQuoteOverride(null);
          }}
        />
      )}

      {/* Explicit Optional Google AdMob Rewarded Video & UMP Consent Modal */}
      {adModalState.open && (
        <RewardedAdFlowModal
          mode={adModalState.mode}
          level={
            adModalState.levelId
              ? rewardSnapshot.levels.find((l) => l.config.id === adModalState.levelId) ?? null
              : null
          }
          consentState={consentState}
          onSetConsentChoice={handleSetConsentChoice}
          onRewardEarnedGrant={handleRewardEarnedGrant}
          onClose={() =>
            setAdModalState({ open: false, mode: 'unlock', levelId: null })
          }
        />
      )}
      {/* One-Time Consumer Quick Guide (shows automatically once on first Home visit, replayable from Settings) */}
      {(showQuickGuideModal || (route === 'home' && !state.settings.hasSeenQuickGuide)) && (
        <OneTimeQuickGuideModal
          displayName={state.settings.displayName}
          isFirstTime={!state.settings.hasSeenQuickGuide}
          onComplete={() => {
            setShowQuickGuideModal(false);
            if (!state.settings.hasSeenQuickGuide) {
              handleUpdateSettings({ hasSeenQuickGuide: true });
            }
          }}
        />
      )}
    </div>
  );
}
