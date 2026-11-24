import {
  Affirmation,
  AppreciationPrompt,
  GuidedReflectionResponses,
  MotivationCategory,
} from '../types/dailyTide';

export const MOTIVATION_CATEGORIES: MotivationCategory[] = [
  'Self-confidence',
  'Discipline',
  'Consistency',
  'Personal growth',
  'Gratitude',
  'New beginnings',
  'Positive thinking',
];

export interface ReflectionQuestion {
  key: keyof GuidedReflectionResponses;
  question: string;
  placeholder: string;
}

export const DAILY_REFLECTION_QUESTIONS: ReflectionQuestion[] = [
  {
    key: 'happyToday',
    question: 'What made me happy today?',
    placeholder: 'A small moment, conversation, warm drink, or quiet win...',
  },
  {
    key: 'accomplished',
    question: 'What did I accomplish?',
    placeholder: 'Big or small — every finished step counts...',
  },
  {
    key: 'gratefulFor',
    question: 'What am I grateful for?',
    placeholder: 'Something steady, comforting, or kind in your life today...',
  },
  {
    key: 'learnedToday',
    question: 'What did I learn today?',
    placeholder: 'An insight about yourself, your pace, or the world...',
  },
  {
    key: 'improveTomorrow',
    question: 'What can I improve tomorrow?',
    placeholder: 'One gentle adjustment to make tomorrow feel lighter...',
  },
];

export const SELF_APPRECIATION_PROMPTS: AppreciationPrompt[] = [
  {
    id: 'pr_love_self',
    promptText: 'One thing I love about myself.',
    category: 'Self-Love',
  },
  {
    id: 'pr_difficult',
    promptText: 'Something difficult I handled.',
    category: 'Resilience',
  },
  {
    id: 'pr_small_win',
    promptText: 'A small achievement I am proud of.',
    category: 'Small Wins',
  },
  {
    id: 'pr_kindness',
    promptText: 'Something kind I did today.',
    category: 'Kindness',
  },
  {
    id: 'pr_calm_moment',
    promptText: 'A boundary I honored or a moment I chose peace.',
    category: 'Presence',
  },
  {
    id: 'pr_effort',
    promptText: 'An unseen effort I made recently that deserves quiet credit.',
    category: 'Resilience',
  },
  {
    id: 'pr_friend_lens',
    promptText: 'If a close friend had my exact day, what would I appreciate about them?',
    category: 'Kindness',
  },
];

/**
 * 105 original offline motivational messages (15 per category across 7 categories).
 * Zero network calls, zero external API dependencies.
 */
export const MOTIVATION_LIBRARY: Omit<Affirmation, 'isFavorite'>[] = [
  // 1. Self-confidence (15)
  { id: 'sc_01', toneCategory: 'Self-confidence', text: 'You have already navigated every difficult day before this one with quiet strength.' },
  { id: 'sc_02', toneCategory: 'Self-confidence', text: 'Trust the version of yourself that shows up even when certainty is not guaranteed.' },
  { id: 'sc_03', toneCategory: 'Self-confidence', text: 'Your worth is not measured by perfection; it lives in how honestly you care.' },
  { id: 'sc_04', toneCategory: 'Self-confidence', text: 'Quiet confidence grows each time you keep a small promise to yourself.' },
  { id: 'sc_05', toneCategory: 'Self-confidence', text: 'You are allowed to take up space calmly and speak with steady conviction.' },
  { id: 'sc_06', toneCategory: 'Self-confidence', text: 'Self-doubt is only passing weather; your capability is the sky behind it.' },
  { id: 'sc_07', toneCategory: 'Self-confidence', text: 'You do not have to imitate anyone else’s rhythm to succeed in your own.' },
  { id: 'sc_08', toneCategory: 'Self-confidence', text: 'Every skill you admire in yourself today once felt unfamiliar at the start.' },
  { id: 'sc_09', toneCategory: 'Self-confidence', text: 'Stand tall in what you know, and stay gently curious about what you are still learning.' },
  { id: 'sc_10', toneCategory: 'Self-confidence', text: 'You bring a perspective and warmth to this world that no one else can replicate.' },
  { id: 'sc_11', toneCategory: 'Self-confidence', text: 'When you treat yourself like someone worthy of care, your courage rises naturally.' },
  { id: 'sc_12', toneCategory: 'Self-confidence', text: 'Mistakes are notes on a rough draft, never a verdict on who you are.' },
  { id: 'sc_13', toneCategory: 'Self-confidence', text: 'Believe in the steady effort you put in when nobody is applauding.' },
  { id: 'sc_14', toneCategory: 'Self-confidence', text: 'Your voice matters most when you stop shrinking it to fit old expectations.' },
  { id: 'sc_15', toneCategory: 'Self-confidence', text: 'You are far more resourceful and resilient than your tired moments suggest.' },

  // 2. Discipline (15)
  { id: 'di_01', toneCategory: 'Discipline', text: 'Gentle discipline is simply choosing your future peace over temporary distraction.' },
  { id: 'di_02', toneCategory: 'Discipline', text: 'Start the task for two calm minutes; momentum rarely asks for permission once you begin.' },
  { id: 'di_03', toneCategory: 'Discipline', text: 'True discipline is not harshness—it is loyal follow-through on what matters to you.' },
  { id: 'di_04', toneCategory: 'Discipline', text: 'Clear boundaries around your focus protect the energy you need for meaningful work.' },
  { id: 'di_05', toneCategory: 'Discipline', text: 'Doing the small right thing today saves you from carrying tomorrow’s stress.' },
  { id: 'di_06', toneCategory: 'Discipline', text: 'You do not need a burst of inspiration to complete one thoughtful step.' },
  { id: 'di_07', toneCategory: 'Discipline', text: 'Structure creates freedom: when essentials are tended, your mind rests easier.' },
  { id: 'di_08', toneCategory: 'Discipline', text: 'Finish one honest priority before opening three new tabs in your mind.' },
  { id: 'di_09', toneCategory: 'Discipline', text: 'Discipline feels lighter when it is rooted in self-respect rather than self-criticism.' },
  { id: 'di_10', toneCategory: 'Discipline', text: 'Keep your word to yourself on ordinary afternoons; that is where character settles in.' },
  { id: 'di_11', toneCategory: 'Discipline', text: 'Saying a calm no to noise is saying a clear yes to your own well-being.' },
  { id: 'di_12', toneCategory: 'Discipline', text: 'Prepare tonight’s space for five minutes so tomorrow’s morning flows without friction.' },
  { id: 'di_13', toneCategory: 'Discipline', text: 'Action cures overwhelm faster than overthinking ever will.' },
  { id: 'di_14', toneCategory: 'Discipline', text: 'Every glass of water and completed routine is proof that you can guide your own day.' },
  { id: 'di_15', toneCategory: 'Discipline', text: 'Focus on steering the next hour well; the whole day follows naturally.' },

  // 3. Consistency (15)
  { id: 'co_01', toneCategory: 'Consistency', text: 'Small, steady steps quietly reshape entire seasons.' },
  { id: 'co_02', toneCategory: 'Consistency', text: 'A five-minute ritual kept most days outperforms an intense plan abandoned in a week.' },
  { id: 'co_03', toneCategory: 'Consistency', text: 'Consistency is like an ocean tide—it rises, rests, and returns without guilt.' },
  { id: 'co_04', toneCategory: 'Consistency', text: 'Missing a day does not undo your progress; returning gently is the real habit.' },
  { id: 'co_05', toneCategory: 'Consistency', text: 'Little habits compound softly into better days long before the results become loud.' },
  { id: 'co_06', toneCategory: 'Consistency', text: 'Show up at half-energy on low days instead of waiting for mythical perfect days.' },
  { id: 'co_07', toneCategory: 'Consistency', text: 'Rhythm beats intensity whenever you are building a life you actually enjoy living.' },
  { id: 'co_08', toneCategory: 'Consistency', text: 'One glass, one breath, one page—repeated kindly—becomes an anchor.' },
  { id: 'co_09', toneCategory: 'Consistency', text: 'Your daily patterns are quiet votes for the peaceful life you are creating.' },
  { id: 'co_10', toneCategory: 'Consistency', text: 'Sustainability is the secret ingredient that turns good intentions into second nature.' },
  { id: 'co_11', toneCategory: 'Consistency', text: 'Never underestimate the quiet power of doing the basics well again today.' },
  { id: 'co_12', toneCategory: 'Consistency', text: 'Progress rarely looks dramatic in a single afternoon, yet it looks unmistakable over a season.' },
  { id: 'co_13', toneCategory: 'Consistency', text: 'Let your routine bend on busy days so it never has to break.' },
  { id: 'co_14', toneCategory: 'Consistency', text: 'Steady drops polish shoreline stones smoother than any sudden storm.' },
  { id: 'co_15', toneCategory: 'Consistency', text: 'Every time you return to your habits without shame, you strengthen your rhythm.' },

  // 4. Personal growth (15)
  { id: 'pg_01', toneCategory: 'Personal growth', text: 'Growth happens quietly in the pause between reacting and choosing a calmer response.' },
  { id: 'pg_02', toneCategory: 'Personal growth', text: 'Outgrowing old habits is a sign of health, even when the transition feels unfamiliar.' },
  { id: 'pg_03', toneCategory: 'Personal growth', text: 'Curiosity turns setbacks into lessons and lessons into lasting wisdom.' },
  { id: 'pg_04', toneCategory: 'Personal growth', text: 'You are allowed to evolve past versions of yourself that were only trying to survive.' },
  { id: 'pg_05', toneCategory: 'Personal growth', text: 'Listening honestly to your own needs is one of the highest forms of maturity.' },
  { id: 'pg_06', toneCategory: 'Personal growth', text: 'Real self-improvement feels like coming home to yourself, not racing to become someone else.' },
  { id: 'pg_07', toneCategory: 'Personal growth', text: 'Notice what drains your energy and what restores it; that awareness is pure gold.' },
  { id: 'pg_08', toneCategory: 'Personal growth', text: 'Patience with your learning curve lets deeper roots form beneath the surface.' },
  { id: 'pg_09', toneCategory: 'Personal growth', text: 'Ask yourself what today taught you before judging how today went.' },
  { id: 'pg_10', toneCategory: 'Personal growth', text: 'Rest is not the opposite of growth; it is the soil where growth takes hold.' },
  { id: 'pg_11', toneCategory: 'Personal growth', text: 'Every honest reflection clears a little more room for clarity tomorrow.' },
  { id: 'pg_12', toneCategory: 'Personal growth', text: 'Stretching gently beyond comfort builds strength without burning you out.' },
  { id: 'pg_13', toneCategory: 'Personal growth', text: 'Compare yourself only to how kindly you handle today compared to last year.' },
  { id: 'pg_14', toneCategory: 'Personal growth', text: 'Small adjustments in daily awareness create remarkable shifts over time.' },
  { id: 'pg_15', toneCategory: 'Personal growth', text: 'Becoming wiser often means simplifying what you carry, not adding more.' },

  // 5. Gratitude (15)
  { id: 'gr_01', toneCategory: 'Gratitude', text: 'Pausing to appreciate one ordinary comfort softens the entire weight of the day.' },
  { id: 'gr_02', toneCategory: 'Gratitude', text: 'Gratitude does not ignore what is hard; it reminds you of what is still steady.' },
  { id: 'gr_03', toneCategory: 'Gratitude', text: 'Thank your body today for carrying you quietly through every breath and step.' },
  { id: 'gr_04', toneCategory: 'Gratitude', text: 'A clean glass of water, a quiet minute, and a fresh breath are small luxuries worth noticing.' },
  { id: 'gr_05', toneCategory: 'Gratitude', text: 'What you appreciate in yourself grows steadier each time you acknowledge it.' },
  { id: 'gr_06', toneCategory: 'Gratitude', text: 'Joy often arrives disguised as a simple moment you slowed down enough to witness.' },
  { id: 'gr_07', toneCategory: 'Gratitude', text: 'Naming three quiet blessings shifts your mind from scarcity back toward calm.' },
  { id: 'gr_08', toneCategory: 'Gratitude', text: 'Be thankful for the lessons that softened your edges without hardening your heart.' },
  { id: 'gr_09', toneCategory: 'Gratitude', text: 'Even on unfinished days, there is almost always something small that went gently right.' },
  { id: 'gr_10', toneCategory: 'Gratitude', text: 'Gratitude turns routine moments—making tea, opening a window—into tiny sanctuaries.' },
  { id: 'gr_11', toneCategory: 'Gratitude', text: 'Appreciate the past version of you whose quiet effort brought you to where you stand.' },
  { id: 'gr_12', toneCategory: 'Gratitude', text: 'Warmth shared with someone else has a quiet way of refilling your own cup.' },
  { id: 'gr_13', toneCategory: 'Gratitude', text: 'Noticing enough-ness right now is a peaceful antidote to constant rushing.' },
  { id: 'gr_14', toneCategory: 'Gratitude', text: 'Your senses offer dozens of small gifts each hour when you look up from the rush.' },
  { id: 'gr_15', toneCategory: 'Gratitude', text: 'A grateful heart carries lightness into places that once felt heavy.' },

  // 6. New beginnings (15)
  { id: 'nb_01', toneCategory: 'New beginnings', text: 'Today is a fresh shoreline—begin right where you stand, without carrying yesterday’s tide.' },
  { id: 'nb_02', toneCategory: 'New beginnings', text: 'You do not need a Monday or a new month to reset your rhythm; this very hour counts.' },
  { id: 'nb_03', toneCategory: 'New beginnings', text: 'Every sunrise offers clean sand where you can trace a kinder pattern.' },
  { id: 'nb_04', toneCategory: 'New beginnings', text: 'Letting go of how yesterday ended frees both hands to welcome today.' },
  { id: 'nb_05', toneCategory: 'New beginnings', text: 'Starting over with experience is never starting from zero.' },
  { id: 'nb_06', toneCategory: 'New beginnings', text: 'A single mindful breath can mark the boundary between a stressful morning and a calm afternoon.' },
  { id: 'nb_07', toneCategory: 'New beginnings', text: 'Welcome this chapter lightly; you do not have to see the whole staircase to take step one.' },
  { id: 'nb_08', toneCategory: 'New beginnings', text: 'Fresh starts work best when they begin small, forgiving, and genuinely yours.' },
  { id: 'nb_09', toneCategory: 'New beginnings', text: 'Give yourself permission to rewrite a habit that no longer fits who you are becoming.' },
  { id: 'nb_10', toneCategory: 'New beginnings', text: 'Nothing about a slow morning prevents a meaningful, grounded evening.' },
  { id: 'nb_11', toneCategory: 'New beginnings', text: 'New seasons arrive quietly first—trust the early buds even before full bloom.' },
  { id: 'nb_12', toneCategory: 'New beginnings', text: 'Forgive the unfinished pages behind you and enjoy the clean warmth of today’s page.' },
  { id: 'nb_13', toneCategory: 'New beginnings', text: 'Every glass of water at dawn is a quiet ceremony of renewal.' },
  { id: 'nb_14', toneCategory: 'New beginnings', text: 'Change becomes inviting the moment you treat it as an experiment rather than an exam.' },
  { id: 'nb_15', toneCategory: 'New beginnings', text: 'Whatever came before this moment, your next calm choice begins a brand-new direction.' },

  // 7. Positive thinking (15)
  { id: 'pt_01', toneCategory: 'Positive thinking', text: 'Calm optimism is choosing to look for the doorway instead of staring only at the wall.' },
  { id: 'pt_02', toneCategory: 'Positive thinking', text: 'Speak to yourself today with the same encouragement you offer your dearest friend.' },
  { id: 'pt_03', toneCategory: 'Positive thinking', text: 'Good things often unfold in quiet increments—stay open to gentle surprises today.' },
  { id: 'pt_04', toneCategory: 'Positive thinking', text: 'When your thoughts race toward worry, ask what could peacefully go right instead.' },
  { id: 'pt_05', toneCategory: 'Positive thinking', text: 'A steady, hopeful mindset does not deny clouds; it remembers the sun above them.' },
  { id: 'pt_06', toneCategory: 'Positive thinking', text: 'You are allowed to expect kindness, clarity, and brighter afternoons ahead.' },
  { id: 'pt_07', toneCategory: 'Positive thinking', text: 'Replacing harsh self-talk with one gentle sentence changes the climate of your whole day.' },
  { id: 'pt_08', toneCategory: 'Positive thinking', text: 'Even low tides reveal shells and treasures that high water kept hidden.' },
  { id: 'pt_09', toneCategory: 'Positive thinking', text: 'Look for one spark of ease in this hour and let your attention rest there.' },
  { id: 'pt_10', toneCategory: 'Positive thinking', text: 'Your energy flows where your focus settles—feed thoughts that make you feel steadier.' },
  { id: 'pt_11', toneCategory: 'Positive thinking', text: 'Peace is not waiting at the end of your to-do list; you can invite it into this minute.' },
  { id: 'pt_12', toneCategory: 'Positive thinking', text: 'Every challenge carries a hidden skill waiting to strengthen you.' },
  { id: 'pt_13', toneCategory: 'Positive thinking', text: 'Bright days are built from tiny pockets of light you choose to notice along the way.' },
  { id: 'pt_14', toneCategory: 'Positive thinking', text: 'Trust that steady care for your mind and body is already working in your favor.' },
  { id: 'pt_15', toneCategory: 'Positive thinking', text: 'Breathe in calm, exhale hurry—today still holds room for something wonderful.' },
];
