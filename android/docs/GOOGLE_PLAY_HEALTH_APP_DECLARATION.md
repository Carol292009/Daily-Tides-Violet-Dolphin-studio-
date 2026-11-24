# Daily Tide — Google Play Health Apps Declaration Guide

**Application Name:** Daily Tide  
**Developer Studio:** Violet Dolphin Studio  
**Android Package ID:** `com.violetdolphinstudio.dailytide`  

---

## 1. Does Google Play's Health Apps Declaration Apply?

**Yes.** Because Daily Tide helps users track personal daily water intake, general wellness habits, mood awareness, mindfulness reflections, and offers an optional informational BMI & hydration range calculator, you **must** complete **Play Console → App Content → Health Apps** before publishing to production.

---

## 2. Recommended Play Console Health Apps Declaration Selections

Select **only** the general wellness / personal tracking categories that match Daily Tide's actual features:

| Play Console Health Category | Select? | Justification |
|---|---|---|
| **Activity and fitness** | **Yes** | Daily hydration intake logging, personal routine habits, and general activity level selection for informational hydration range guidance. |
| **Nutrition and weight management** | **Yes** (if exposing BMI & hydration calculator) | Optional informational height/weight BMI reference and non-medical daily litre hydration range estimator. |
| **Stress management, relaxation, mental acuity** | **Yes** | Calm mood check-ins, daily gratitude/self-appreciation, guided reflection journaling, breathing/mindfulness micro-challenges, and motivational library. |
| **Sleep management** | **No** | Quiet hours only silence local notifications; Daily Tide does not track sleep. |
| **Period tracking / Reproductive health** | **No** | Not part of Daily Tide. |
| **Diseases and conditions management / Clinical decision support / Medical device / Medication management** | **No** | Daily Tide is **not** a medical device and provides zero medical diagnosis, treatment, or clinical advice. |
| **Health Connect permissions** | **No** | Daily Tide does **not** integrate Android Health Connect APIs. |
| **Human subjects research** | **No** | Daily Tide collects zero research data and transmits zero wellness logs. |

---

## 3. Required Non-Medical Framing & Disclaimers (Verified in App)

Daily Tide already adheres strictly to Google Play's wellness & non-medical safety guidelines:

1. **No Universal Medical Prescription:** Daily Tide never prescribes a single universal water intake as medically appropriate for everyone; users set and customize their own daily water target.
2. **Clear Informational Disclaimer:** The optional BMI & Safe Hydration Guide explicitly states it is for **general personal wellness and educational guidance only**, not medical advice, and advises consulting a qualified healthcare professional for medical conditions, pregnancy, kidney/heart considerations, or specific dietary needs.
3. **Ethical, Non-Shaming Retention:** Consistency streaks and self-care quests never punish, shame, or induce anxiety over missed days.
4. **No Off-Device Health Data Transmission:** All hydration logs, moods, journal reflections, and body metrics remain strictly inside local on-device storage (`Room` & `DataStore`) with cloud Auto Backup disabled.

---

## 4. Store Listing & Review Tips

- In your Google Play Short & Full Descriptions, describe Daily Tide as a **personal offline-first self-care, hydration tracking, habit, and journaling companion** — avoid clinical terms like *"treats anxiety"*, *"cures dehydration"*, *"medical monitor"*, or *"doctor-recommended"*.
- Ensure your hosted Privacy Policy URL explicitly mentions both:
  1. Local-only storage of wellness/hydration/reflection records.
  2. Technical/advertising data collection by Google Mobile Ads SDK when optional rewarded ads are used.
