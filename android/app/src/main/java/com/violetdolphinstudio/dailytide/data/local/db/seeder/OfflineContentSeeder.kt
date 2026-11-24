package com.violetdolphinstudio.dailytide.data.local.db.seeder

import com.violetdolphinstudio.dailytide.data.local.db.DailyTideDatabase
import com.violetdolphinstudio.dailytide.data.local.db.entity.AffirmationEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.AppreciationPromptEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.BadgeEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.SelfCareChallengeEntity
import com.violetdolphinstudio.dailytide.data.local.db.entity.WaterVesselEntity

object OfflineContentSeeder {

    suspend fun seedIfNeeded(database: DailyTideDatabase) {
        val hydrationDao = database.hydrationDao()
        val reflectionDao = database.reflectionDao()
        val habitChallengeDao = database.habitChallengeDao()
        val progressBadgeDao = database.progressBadgeDao()

        if (hydrationDao.vesselCount() == 0) {
            hydrationDao.insertVessels(defaultVessels())
        }

        reflectionDao.insertAffirmations(curatedMotivationLibrary())
        reflectionDao.insertPrompts(curatedAppreciationPrompts())
        habitChallengeDao.insertChallenges(curatedChallenges())
        progressBadgeDao.insertBadges(curatedBadges())
    }

    private fun defaultVessels(): List<WaterVesselEntity> = listOf(
        WaterVesselEntity(name = "Small Cup", volumeMl = 150, iconKey = "cup", sortOrder = 0, isDefault = false),
        WaterVesselEntity(name = "Glass", volumeMl = 250, iconKey = "glass", sortOrder = 1, isDefault = true),
        WaterVesselEntity(name = "Bottle", volumeMl = 500, iconKey = "bottle", sortOrder = 2, isDefault = false),
        WaterVesselEntity(name = "Large Flask", volumeMl = 750, iconKey = "flask", sortOrder = 3, isDefault = false)
    )

    /**
     * 105 original offline motivational messages (15 per category across 7 themes).
     * Stored locally in Room — zero online API dependencies.
     */
    fun curatedMotivationLibrary(): List<AffirmationEntity> = listOf(
        // 1. Self-confidence (15)
        AffirmationEntity("sc_01", "You have already navigated every difficult day before this one with quiet strength.", "Self-confidence"),
        AffirmationEntity("sc_02", "Trust the version of yourself that shows up even when certainty is not guaranteed.", "Self-confidence"),
        AffirmationEntity("sc_03", "Your worth is not measured by perfection; it lives in how honestly you care.", "Self-confidence"),
        AffirmationEntity("sc_04", "Quiet confidence grows each time you keep a small promise to yourself.", "Self-confidence"),
        AffirmationEntity("sc_05", "You are allowed to take up space calmly and speak with steady conviction.", "Self-confidence"),
        AffirmationEntity("sc_06", "Self-doubt is only passing weather; your capability is the sky behind it.", "Self-confidence"),
        AffirmationEntity("sc_07", "You do not have to imitate anyone else's rhythm to succeed in your own.", "Self-confidence"),
        AffirmationEntity("sc_08", "Every skill you admire in yourself today once felt unfamiliar at the start.", "Self-confidence"),
        AffirmationEntity("sc_09", "Stand tall in what you know, and stay gently curious about what you are still learning.", "Self-confidence"),
        AffirmationEntity("sc_10", "You bring a perspective and warmth to this world that no one else can replicate.", "Self-confidence"),
        AffirmationEntity("sc_11", "When you treat yourself like someone worthy of care, your courage rises naturally.", "Self-confidence"),
        AffirmationEntity("sc_12", "Mistakes are notes on a rough draft, never a verdict on who you are.", "Self-confidence"),
        AffirmationEntity("sc_13", "Believe in the steady effort you put in when nobody is applauding.", "Self-confidence"),
        AffirmationEntity("sc_14", "Your voice matters most when you stop shrinking it to fit old expectations.", "Self-confidence"),
        AffirmationEntity("sc_15", "You are far more resourceful and resilient than your tired moments suggest.", "Self-confidence"),

        // 2. Discipline (15)
        AffirmationEntity("di_01", "Gentle discipline is simply choosing your future peace over temporary distraction.", "Discipline"),
        AffirmationEntity("di_02", "Start the task for two calm minutes; momentum rarely asks for permission once you begin.", "Discipline"),
        AffirmationEntity("di_03", "True discipline is not harshness—it is loyal follow-through on what matters to you.", "Discipline"),
        AffirmationEntity("di_04", "Clear boundaries around your focus protect the energy you need for meaningful work.", "Discipline"),
        AffirmationEntity("di_05", "Doing the small right thing today saves you from carrying tomorrow's stress.", "Discipline"),
        AffirmationEntity("di_06", "You do not need a burst of inspiration to complete one thoughtful step.", "Discipline"),
        AffirmationEntity("di_07", "Structure creates freedom: when essentials are tended, your mind rests easier.", "Discipline"),
        AffirmationEntity("di_08", "Finish one honest priority before opening three new tabs in your mind.", "Discipline"),
        AffirmationEntity("di_09", "Discipline feels lighter when it is rooted in self-respect rather than self-criticism.", "Discipline"),
        AffirmationEntity("di_10", "Keep your word to yourself on ordinary afternoons; that is where character settles in.", "Discipline"),
        AffirmationEntity("di_11", "Saying a calm no to noise is saying a clear yes to your own well-being.", "Discipline"),
        AffirmationEntity("di_12", "Prepare tonight's space for five minutes so tomorrow's morning flows without friction.", "Discipline"),
        AffirmationEntity("di_13", "Action cures overwhelm faster than overthinking ever will.", "Discipline"),
        AffirmationEntity("di_14", "Every glass of water and completed routine is proof that you can guide your own day.", "Discipline"),
        AffirmationEntity("di_15", "Focus on steering the next hour well; the whole day follows naturally.", "Discipline"),

        // 3. Consistency (15)
        AffirmationEntity("co_01", "Small, steady steps quietly reshape entire seasons.", "Consistency"),
        AffirmationEntity("co_02", "A five-minute ritual kept most days outperforms an intense plan abandoned in a week.", "Consistency"),
        AffirmationEntity("co_03", "Consistency is like an ocean tide—it rises, rests, and returns without guilt.", "Consistency"),
        AffirmationEntity("co_04", "Missing a day does not undo your progress; returning gently is the real habit.", "Consistency"),
        AffirmationEntity("co_05", "Little habits compound softly into better days long before the results become loud.", "Consistency"),
        AffirmationEntity("co_06", "Show up at half-energy on low days instead of waiting for mythical perfect days.", "Consistency"),
        AffirmationEntity("co_07", "Rhythm beats intensity whenever you are building a life you actually enjoy living.", "Consistency"),
        AffirmationEntity("co_08", "One glass, one breath, one page—repeated kindly—becomes an anchor.", "Consistency"),
        AffirmationEntity("co_09", "Your daily patterns are quiet votes for the peaceful life you are creating.", "Consistency"),
        AffirmationEntity("co_10", "Sustainability is the secret ingredient that turns good intentions into second nature.", "Consistency"),
        AffirmationEntity("co_11", "Never underestimate the quiet power of doing the basics well again today.", "Consistency"),
        AffirmationEntity("co_12", "Progress rarely looks dramatic in a single afternoon, yet it looks unmistakable over a season.", "Consistency"),
        AffirmationEntity("co_13", "Let your routine bend on busy days so it never has to break.", "Consistency"),
        AffirmationEntity("co_14", "Steady drops polish shoreline stones smoother than any sudden storm.", "Consistency"),
        AffirmationEntity("co_15", "Every time you return to your habits without shame, you strengthen your rhythm.", "Consistency"),

        // 4. Personal growth (15)
        AffirmationEntity("pg_01", "Growth happens quietly in the pause between reacting and choosing a calmer response.", "Personal growth"),
        AffirmationEntity("pg_02", "Outgrowing old habits is a sign of health, even when the transition feels unfamiliar.", "Personal growth"),
        AffirmationEntity("pg_03", "Curiosity turns setbacks into lessons and lessons into lasting wisdom.", "Personal growth"),
        AffirmationEntity("pg_04", "You are allowed to evolve past versions of yourself that were only trying to survive.", "Personal growth"),
        AffirmationEntity("pg_05", "Listening honestly to your own needs is one of the highest forms of maturity.", "Personal growth"),
        AffirmationEntity("pg_06", "Real self-improvement feels like coming home to yourself, not racing to become someone else.", "Personal growth"),
        AffirmationEntity("pg_07", "Notice what drains your energy and what restores it; that awareness is pure gold.", "Personal growth"),
        AffirmationEntity("pg_08", "Patience with your learning curve lets deeper roots form beneath the surface.", "Personal growth"),
        AffirmationEntity("pg_09", "Ask yourself what today taught you before judging how today went.", "Personal growth"),
        AffirmationEntity("pg_10", "Rest is not the opposite of growth; it is the soil where growth takes hold.", "Personal growth"),
        AffirmationEntity("pg_11", "Every honest reflection clears a little more room for clarity tomorrow.", "Personal growth"),
        AffirmationEntity("pg_12", "Stretching gently beyond comfort builds strength without burning you out.", "Personal growth"),
        AffirmationEntity("pg_13", "Compare yourself only to how kindly you handle today compared to last year.", "Personal growth"),
        AffirmationEntity("pg_14", "Small adjustments in daily awareness create remarkable shifts over time.", "Personal growth"),
        AffirmationEntity("pg_15", "Becoming wiser often means simplifying what you carry, not adding more.", "Personal growth"),

        // 5. Gratitude (15)
        AffirmationEntity("gr_01", "Pausing to appreciate one ordinary comfort softens the entire weight of the day.", "Gratitude"),
        AffirmationEntity("gr_02", "Gratitude does not ignore what is hard; it reminds you of what is still steady.", "Gratitude"),
        AffirmationEntity("gr_03", "Thank your body today for carrying you quietly through every breath and step.", "Gratitude"),
        AffirmationEntity("gr_04", "A clean glass of water, a quiet minute, and a fresh breath are small luxuries worth noticing.", "Gratitude"),
        AffirmationEntity("gr_05", "What you appreciate in yourself grows steadier each time you acknowledge it.", "Gratitude"),
        AffirmationEntity("gr_06", "Joy often arrives disguised as a simple moment you slowed down enough to witness.", "Gratitude"),
        AffirmationEntity("gr_07", "Naming three quiet blessings shifts your mind from scarcity back toward calm.", "Gratitude"),
        AffirmationEntity("gr_08", "Be thankful for the lessons that softened your edges without hardening your heart.", "Gratitude"),
        AffirmationEntity("gr_09", "Even on unfinished days, there is almost always something small that went gently right.", "Gratitude"),
        AffirmationEntity("gr_10", "Gratitude turns routine moments—making tea, opening a window—into tiny sanctuaries.", "Gratitude"),
        AffirmationEntity("gr_11", "Appreciate the past version of you whose quiet effort brought you to where you stand.", "Gratitude"),
        AffirmationEntity("gr_12", "Warmth shared with someone else has a quiet way of refilling your own cup.", "Gratitude"),
        AffirmationEntity("gr_13", "Noticing enough-ness right now is a peaceful antidote to constant rushing.", "Gratitude"),
        AffirmationEntity("gr_14", "Your senses offer dozens of small gifts each hour when you look up from the rush.", "Gratitude"),
        AffirmationEntity("gr_15", "A grateful heart carries lightness into places that once felt heavy.", "Gratitude"),

        // 6. New beginnings (15)
        AffirmationEntity("nb_01", "Today is a fresh shoreline—begin right where you stand, without carrying yesterday's tide.", "New beginnings"),
        AffirmationEntity("nb_02", "You do not need a Monday or a new month to reset your rhythm; this very hour counts.", "New beginnings"),
        AffirmationEntity("nb_03", "Every sunrise offers clean sand where you can trace a kinder pattern.", "New beginnings"),
        AffirmationEntity("nb_04", "Letting go of how yesterday ended frees both hands to welcome today.", "New beginnings"),
        AffirmationEntity("nb_05", "Starting over with experience is never starting from zero.", "New beginnings"),
        AffirmationEntity("nb_06", "A single mindful breath can mark the boundary between a stressful morning and a calm afternoon.", "New beginnings"),
        AffirmationEntity("nb_07", "Welcome this chapter lightly; you do not have to see the whole staircase to take step one.", "New beginnings"),
        AffirmationEntity("nb_08", "Fresh starts work best when they begin small, forgiving, and genuinely yours.", "New beginnings"),
        AffirmationEntity("nb_09", "Give yourself permission to rewrite a habit that no longer fits who you are becoming.", "New beginnings"),
        AffirmationEntity("nb_10", "Nothing about a slow morning prevents a meaningful, grounded evening.", "New beginnings"),
        AffirmationEntity("nb_11", "New seasons arrive quietly first—trust the early buds even before full bloom.", "New beginnings"),
        AffirmationEntity("nb_12", "Forgive the unfinished pages behind you and enjoy the clean warmth of today's page.", "New beginnings"),
        AffirmationEntity("nb_13", "Every glass of water at dawn is a quiet ceremony of renewal.", "New beginnings"),
        AffirmationEntity("nb_14", "Change becomes inviting the moment you treat it as an experiment rather than an exam.", "New beginnings"),
        AffirmationEntity("nb_15", "Whatever came before this moment, your next calm choice begins a brand-new direction.", "New beginnings"),

        // 7. Positive thinking (15)
        AffirmationEntity("pt_01", "Calm optimism is choosing to look for the doorway instead of staring only at the wall.", "Positive thinking"),
        AffirmationEntity("pt_02", "Speak to yourself today with the same encouragement you offer your dearest friend.", "Positive thinking"),
        AffirmationEntity("pt_03", "Good things often unfold in quiet increments—stay open to gentle surprises today.", "Positive thinking"),
        AffirmationEntity("pt_04", "When your thoughts race toward worry, ask what could peacefully go right instead.", "Positive thinking"),
        AffirmationEntity("pt_05", "A steady, hopeful mindset does not deny clouds; it remembers the sun above them.", "Positive thinking"),
        AffirmationEntity("pt_06", "You are allowed to expect kindness, clarity, and brighter afternoons ahead.", "Positive thinking"),
        AffirmationEntity("pt_07", "Replacing harsh self-talk with one gentle sentence changes the climate of your whole day.", "Positive thinking"),
        AffirmationEntity("pt_08", "Even low tides reveal shells and treasures that high water kept hidden.", "Positive thinking"),
        AffirmationEntity("pt_09", "Look for one spark of ease in this hour and let your attention rest there.", "Positive thinking"),
        AffirmationEntity("pt_10", "Your energy flows where your focus settles—feed thoughts that make you feel steadier.", "Positive thinking"),
        AffirmationEntity("pt_11", "Peace is not waiting at the end of your to-do list; you can invite it into this minute.", "Positive thinking"),
        AffirmationEntity("pt_12", "Every challenge carries a hidden skill waiting to strengthen you.", "Positive thinking"),
        AffirmationEntity("pt_13", "Bright days are built from tiny pockets of light you choose to notice along the way.", "Positive thinking"),
        AffirmationEntity("pt_14", "Trust that steady care for your mind and body is already working in your favor.", "Positive thinking"),
        AffirmationEntity("pt_15", "Breathe in calm, exhale hurry—today still holds room for something wonderful.", "Positive thinking")
    )

    private fun curatedAppreciationPrompts(): List<AppreciationPromptEntity> = listOf(
        AppreciationPromptEntity("pr_love_self", "One thing I love about myself.", "Self-Love"),
        AppreciationPromptEntity("pr_difficult", "Something difficult I handled.", "Resilience"),
        AppreciationPromptEntity("pr_small_win", "A small achievement I am proud of.", "Small Wins"),
        AppreciationPromptEntity("pr_kindness", "Something kind I did today.", "Kindness"),
        AppreciationPromptEntity("pr_calm_moment", "A boundary I honored or a moment I chose peace.", "Presence"),
        AppreciationPromptEntity("pr_effort", "An unseen effort I made recently that deserves quiet credit.", "Resilience"),
        AppreciationPromptEntity("pr_friend_lens", "If a close friend had my exact day, what would I appreciate about them?", "Kindness")
    )

    private fun curatedChallenges(): List<SelfCareChallengeEntity> = listOf(
        SelfCareChallengeEntity("ch_01", "Window Horizon Pause", "Look at something distant outside for 60 seconds and relax your eyes.", "Mind", 2),
        SelfCareChallengeEntity("ch_02", "Shoulder Drop Reset", "Roll your shoulders slowly back five times and release jaw tension.", "Body", 2),
        SelfCareChallengeEntity("ch_03", "Mindful Sip", "Drink one full glass of water without looking at any screen.", "Body", 2),
        SelfCareChallengeEntity("ch_04", "Two-Minute Tidy", "Clear just one small surface near you so your space feels lighter.", "Space", 2),
        SelfCareChallengeEntity("ch_05", "Kind Text Ripple", "Send a short, warm message to someone who crossed your mind.", "Joy", 3),
        SelfCareChallengeEntity("ch_06", "Box Breath Rhythm", "Inhale 4 seconds, hold 4, exhale 4, rest 4 — repeat four rounds.", "Mind", 3),
        SelfCareChallengeEntity("ch_07", "Sunlight Step", "Step near natural light or outdoors for three unhurried minutes.", "Joy", 3),
        SelfCareChallengeEntity("ch_08", "Digital Breath", "Silence notifications for 15 minutes while you finish one calm task.", "Space", 5)
    )

    private fun curatedBadges(): List<BadgeEntity> = listOf(
        BadgeEntity("first_ripple", "First Ripple", "Logged your very first sip of water in Daily Tide.", "Hydration", null, 0, 1),
        BadgeEntity("calm_hydration", "Steady Stream", "Logged 10 total glasses of water across your days.", "Hydration", null, 0, 10),
        BadgeEntity("inner_compass", "Inner Compass", "Completed 5 daily mood check-ins.", "Awareness", null, 0, 5),
        BadgeEntity("appreciation_keeper", "Appreciation Keeper", "Saved 3 answers in your Self-Appreciation Vault.", "Reflection", null, 0, 3),
        BadgeEntity("quiet_pages", "Quiet Pages", "Wrote 3 personal journal reflections.", "Reflection", null, 0, 3),
        BadgeEntity("little_habits", "Little Habits", "Checked off 10 habit completions at your own pace.", "Habits", null, 0, 10),
        BadgeEntity("tide_explorer", "Gentle Explorer", "Completed 3 daily self-care challenges.", "Challenges", null, 0, 3),
        BadgeEntity("gentle_return", "Gentle Return", "Showed up for yourself across 3 separate calendar days.", "Rhythm", null, 0, 3)
    )
}
