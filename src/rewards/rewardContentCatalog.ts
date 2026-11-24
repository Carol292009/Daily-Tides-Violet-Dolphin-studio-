import { SelfCareChallenge } from '../types/dailyTide';

/**
 * 100% Offline Bonus Content unlocked by Reward Levels 1, 2, 3, and 4.
 * Essential self-care features remain permanently in the Free Level — these packs are purely optional extras
 * that work completely offline once unlocked until their local expiration timestamp.
 */

export interface SpecialMotivationItem {
  id: string;
  theme: string;
  title: string;
  message: string;
  reflectionCue: string;
}

export const LEVEL_1_SPECIAL_MOTIVATION_COLLECTION: SpecialMotivationItem[] = [
  {
    id: 'sm_01',
    theme: 'Deep Calm',
    title: 'The Quiet Tide Principle',
    message:
      'Ocean tides never hurry, yet they reshape entire coastlines. Let today be shaped by steady, unhurried return rather than sudden exhaustion.',
    reflectionCue: 'Where can you move 15% slower today without losing care?',
  },
  {
    id: 'sm_02',
    theme: 'Inner Steadiness',
    title: 'Rest Is Part of Discipline',
    message:
      'Real consistency includes knowing when to soften your grip. Pausing to breathe is not quitting; it is how you stay well enough to continue tomorrow.',
    reflectionCue: 'What is one expectation you can soften this evening?',
  },
  {
    id: 'sm_03',
    theme: 'Self-Trust',
    title: 'Small Promises Kept',
    message:
      'Confidence is rarely built by grand leaps. It grows quietly each time you pour a glass of water, close your eyes for five breaths, and honor a promise to yourself.',
    reflectionCue: 'Which tiny promise to yourself feels easiest to honor right now?',
  },
  {
    id: 'sm_04',
    theme: 'Clarity',
    title: 'Clear Water Settles',
    message:
      'You cannot force muddy water to clear by stirring it harder. Give your mind two minutes of stillness and watch what rises to the surface.',
    reflectionCue: 'What decision becomes simpler if you wait ten calm minutes?',
  },
  {
    id: 'sm_05',
    theme: 'Renewal',
    title: 'Every Hour Can Restart Gently',
    message:
      'A scattered morning never ruins an entire day. At any moment you can take a fresh glass of water, drop your shoulders, and begin a new tide.',
    reflectionCue: 'What does a gentle reset look like for the next two hours?',
  },
  {
    id: 'sm_06',
    theme: 'Gratitude',
    title: 'Noticing the Ordinary',
    message:
      'Warm light on a wall, cool water after a long stretch, a message from someone kind—ordinary moments carry extraordinary quiet medicine.',
    reflectionCue: 'Name one ordinary detail around you that feels comforting right now.',
  },
];

export interface AdvancedReflectionTemplate {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  prompts: string[];
}

export const LEVEL_2_ADVANCED_REFLECTION_COLLECTION: AdvancedReflectionTemplate[] = [
  {
    id: 'ar_emotional_clarity',
    category: 'Emotional Clarity',
    title: 'Name the Current Beneath the Surface',
    subtitle: 'Untangle mixed feelings gently without self-judgment.',
    prompts: [
      'What emotion showed up most strongly today, and where did I notice it in my body?',
      'What was that feeling trying to protect or ask for?',
      'What would a wise, kind friend say to me about today?',
    ],
  },
  {
    id: 'ar_energy_audit',
    category: 'Energy Audit',
    title: 'What Restored vs. What Drained Me',
    subtitle: 'Spot subtle daily rhythms that nurture your energy.',
    prompts: [
      'Which moment today gave me quiet energy or relief?',
      'Which moment quietly drained me more than I expected?',
      'How can I protect 15 minutes of restorative space tomorrow?',
    ],
  },
  {
    id: 'ar_values_compass',
    category: 'Values Alignment',
    title: 'Living Close to What Matters',
    subtitle: 'Reconnect daily routines with your deeper personal values.',
    prompts: [
      'Which personal value did I honor today through a small action?',
      'Where did I rush out of habit instead of moving with intention?',
      'What is one small choice tomorrow that reflects who I am becoming?',
    ],
  },
  {
    id: 'ar_future_self',
    category: 'Future Self Letter',
    title: 'A Note to Myself One Month Ahead',
    subtitle: 'Anchor perspective and kindness for your future self.',
    prompts: [
      'What challenge am I navigating right now that I hope feels lighter in 30 days?',
      'What quiet strength am I practicing right now that deserves credit?',
      'One gentle reminder I want my future self to read:',
    ],
  },
];

export const LEVEL_3_SPECIAL_CHALLENGES: SelfCareChallenge[] = [
  {
    id: 'sp_ch_01',
    title: 'Digital Sunset Sanctuary',
    description:
      'Dim your lights, silence non-essential alerts, and enjoy 20 screen-free minutes with a glass of water or herbal tea.',
    category: 'Mind',
    durationMinutes: 20,
  },
  {
    id: 'sp_ch_02',
    title: 'Five-Senses Grounding Walk',
    description:
      'Step outside or near an open window and notice 5 calm sights, 4 textures, 3 sounds, 2 scents, and 1 quiet gratitude.',
    category: 'Body',
    durationMinutes: 10,
  },
  {
    id: 'sp_ch_03',
    title: 'Unhurried Tea & Breath Ceremony',
    description:
      'Prepare a warm cup or cool glass of water slowly—feel the temperature, exhale deeply five times, and savor the first sip.',
    category: 'Joy',
    durationMinutes: 8,
  },
  {
    id: 'sp_ch_04',
    title: 'Calm Desk & Horizon Reset',
    description:
      'Clear one workspace surface, refill your hydration vessel, and stretch your neck and shoulders for three unhurried minutes.',
    category: 'Space',
    durationMinutes: 7,
  },
];
