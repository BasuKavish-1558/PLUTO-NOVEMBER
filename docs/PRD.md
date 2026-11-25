# Pluto: Product Requirements Document

Version 1.0 (Final) · Prepared November 23, 2026

> Transcribed from `Pluto Product Requirements Document.pdf`. Clarifications and resolved ambiguities live in [PLAN.md](PLAN.md), not here.

## 1. Overview

**Product:** A responsive web app called Pluto (phone, tablet and desktop) that lets a user set up a weekly workout split, log workouts with a timer, track strength progress, review consistency on a GitHub-style calendar, and hit a daily protein goal.

**Problem:** Most lifters juggle notes apps, spreadsheets and separate nutrition apps. Logging is slow, progress is hard to see, and there is little motivation to stay consistent.

**Solution:** One focused app where setting up a split, logging sets, seeing progress and PRs, and tracking protein all happen in one place, designed from the start so gamification can be layered on later.

## 2. Goals and Non-Goals

### Goals

- Fast onboarding: create an account, enter age, weight and height, and land on the home page.
- Make logging a workout quick: pick the day's split, start the timer, log exercises, sets, reps and weights.
- Show clear progress per exercise (weight lifted, volume, estimated 1RM) with manually logged personal records (PRs).
- Show consistency at a glance through a contribution-style monthly calendar, with photos.
- Track a daily protein goal now, with a nutrition model that can expand to calories and food logging later (tracking only).
- Build the data model so gamification (streaks, XP and badges) can be added without a rewrite.

### Non-Goals (v1)

- Calorie tracking and food logging (planned after v1, tracking only).
- Social features, friends, leaderboards.
- Wearable integration, AI coaching, video exercise demos, data export (planned after launch), or meal plans, recipes and diet coaching (nutrition is tracking only).
- Gamification itself (designed for, not built).

## 3. Target Users

- **Beginners** who want a ready-made split and simple logging.
- **Intermediate lifters** who follow a split and care about progressive overload, PRs and volume.
- **Self-builders** who want to design a custom split from an exercise library.

## 4. User Flow

The app is organised around a first-time setup sequence, followed by the main app.

1. **Create an account with email and password.** The account is created once and the user stays signed in until they log out. Profile name, profile picture and email are captured here.
2. **Basic stats.** Age and body weight are asked next. Height is captured here as well, since it is part of body vitals.
3. **Main app.** One home area from which the user reaches every feature: Split, Workout, Progress, Calendar, Nutrition and Profile.

All onboarding values are editable later from the Profile and Body Vitals screens.

## 5. Feature Requirements

### 5.1 Profile and Authentication

| ID  | Requirement | Priority |
| --- | --- | --- |
| P-1 | Create an account once with an email and password; the user then stays signed in until they log out. | Must |
| P-2 | Profile holds name, profile picture, and email. | Must |
| P-3 | Profile picture can be uploaded from camera or gallery, and replaced later. | Must |
| P-4 | Age is collected during onboarding and editable. | Must |
| P-5 | Sign out and delete account (with data deletion). | Should |
| P-6 | Unit preference: switch between kg/lb and cm/ft-in at any time; all stored values convert everywhere. | Must |

### 5.2 Body Vitals

Tracks body weight and height, both changeable at any time.

- **BV-1:** User can enter and update body weight and height.
- **BV-2:** Every weight update is stored as a dated entry (not overwritten), so a body-weight trend can be charted.
- **BV-3:** Height is a single editable value with a change history optional.
- **BV-4:** Show BMI as a derived read-only value (optional toggle).
- **BV-5:** Body weight chart over time on the Progress page.

### 5.3 Workout Split

A split is a weekly routine mapping each day of the week to a workout (or rest).

- **SP-1:** User picks a **preset split** or builds a **custom split**.
- **SP-2:** At least 5 presets at launch plus custom, all editable after selection:
  - Push / Pull / Legs (PPL)
  - Upper / Lower
  - Full Body (3 days)
  - Bro split (Chest, Back, Shoulders, Arms, Legs)
  - Arnold split, and PHUL (Power Hypertrophy Upper Lower)
- **SP-3:** Custom split: user names each day (e.g. "Push A"), marks rest days, and adds exercises to each day.
- **SP-4:** Exercises are added from the Exercise Library (see 5.4). Each exercise in a split can have target sets and reps (optional).
- **SP-5:** Exercises within a day can be reordered and removed.
- **SP-6:** User can store more than one split but only one is **active** at a time.
- **SP-7:** The Home screen shows today's workout based on the active split. A split is one fixed weekly routine; alternating A/B weeks are out of scope for v1.

### 5.4 Exercise Library

- **EL-1:** Library is organised by muscle group: Chest, Back, Shoulders, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Abs/Core.
- **EL-2:** Each exercise has: name, primary muscle group, secondary muscles (optional), equipment (barbell, dumbbell, machine, cable, bodyweight).
- **EL-3:** User can browse by muscle group, search by name, and filter by equipment.
- **EL-4:** User can add **custom exercises** to the library.
- **EL-5:** Library ships with a seeded set of common exercises (target around 150 at launch).
- **EL-6:** Exercises used in logged workouts cannot be hard-deleted; they are archived to preserve history.

### 5.5 Workout Logging

The core daily-use screen.

- **WK-1:** Start a workout from today's planned split day, or start an empty/ad hoc workout.
- **WK-2:** A **workout timer** starts on begin and runs until the user finishes. It supports pause and resume.
- **WK-3:** Out of scope: no **rest timer** between sets. Only the total workout timer in WK-2 is included.
- **WK-4:** For each exercise, the user logs **sets**: weight, reps, and set number. Warm-up sets can be flagged and excluded from volume calculations.
- **WK-5:** Previous performance for the same exercise (last session's weights and reps) is shown inline as a reference.
- **WK-6:** User can add or remove exercises mid-workout, from the library.
- **WK-7:** Finishing the workout saves a summary: duration, exercises done, total sets, total volume, any PRs the user logged.
- **WK-8:** Optional notes per workout, and the option to attach photos (shown on the calendar, see 5.7).
- **WK-9:** In-progress workout is auto-saved so it survives app closure or crashes.
- **WK-10:** User can edit or delete past workouts.

### 5.6 Progress Tracking

Per-exercise analytics, selectable by exercise and by time range (1M, 3M, 6M, 1Y, All).

| Chart | Definition |
| --- | --- |
| Weight lifted | Top working-set weight per session |
| Volume | Sum of (weight × reps) across working sets per session |
| Estimated 1RM | Best estimated 1RM per session |
| Body weight | Dated body weight entries (from Body Vitals) |

**Estimated 1RM formula (v1):** Epley: `1RM = weight × (1 + reps / 30)`. For a single rep, 1RM equals the weight lifted. The formula is isolated in code so it can be swapped (e.g. Brzycki) later.

**Personal Records (PRs)**

- **PR-1:** PRs are **logged manually** by the user. There is no automatic detection.
- **PR-2:** PR types the user can log, per exercise:
  - Heaviest weight lifted (any rep count)
  - Most reps at a given weight
- **PR-3:** A PR entry needs an exercise, weight and reps. The date comes from the user's device and is never typed in. A note and a photo are optional.
- **PR-4:** A newly logged PR shows a clear visual celebration, and appears in the workout summary when logged during a workout.
- **PR-5:** A **PR list** per exercise shows each record with its date and the previous record it beat.
- **PR-6:** Users can edit or delete their own PR entries; PR entries are independent of workout edits.

### 5.7 Calendar (Consistency View)

A GitHub-contribution-style calendar of when workouts were done.

- **CL-1:** Default view shows the **current month** as a grid of day cells.
- **CL-2:** A day with a logged workout is shaded and a day without one is not (binary shading, no intensity levels).
- **CL-3:** Tapping a day opens the **full log** for that date: split day, exercises, sets, weights, duration, PRs, notes, and photos.
- **CL-4:** User can navigate to previous and next months.
- **CL-5:** User can **add pictures** to a workout day (e.g. gym selfie, progress photo). Up to 3 photos per day are allowed, compressed on upload.
- **CL-6:** Photos can be viewed in a gallery and deleted. They are private by default.
- **CL-7:** Show current workout streak and monthly workout count above the calendar (also feeds future gamification).

### 5.8 Nutrition (v1: Protein)

- **NT-1:** The goal is calculated from body weight and the user's own multiplier (see NT-5), and the user adjusts it by editing the multiplier. The resulting **daily protein goal** in grams is shown on the Home and Nutrition screens.
- **NT-2:** User logs protein intake through the day (quick-add entries with optional label, e.g. "Whey shake, 25 g").
- **NT-3:** Home and Nutrition screens show a progress ring: grams consumed vs goal.
- **NT-4:** Daily totals reset at local midnight. History is retained and viewable per day.
- **NT-5:** The user sets their own multiplier (grams per kg of body weight), and goal = body weight × multiplier. Picking a goal type (cut, maintain or bulk) pre-fills a suggested multiplier (starting assumptions: cut 2.0, maintain 1.6, bulk 1.8) that the user can change. The goal recalculates when body weight changes, and the user cannot type a gram value.
- **NT-6:** The nutrition data model is generic (nutrient type + amount per entry) so calories can be added next, followed by meal and food logging with a food database.

### 5.9 Gamification (Future, Design-For Only)

Not built in v1, but the following must be supported by the architecture:

- An **event log**: every meaningful action (workout completed, set logged, PR logged, protein goal met, photo added) is stored as a timestamped event.
- Chosen direction: a mix of streaks, XP and badges. XP is earned for completed workouts, PRs and protein goals; streaks count consecutive days with a workout; badges mark milestones. Challenges and friend leaderboards are out of scope.
- Streak calculations already exist in v1 and can be reused; PRs are logged manually by the user.

## 6. Screens and Navigation

**Onboarding:** Sign in → Profile (name, photo, email) → Age and body weight (and height) → Home.

**Bottom navigation:**

1. **Home**: today's workout, protein ring, streak, quick start button.
2. **Workout**: start/resume workout, history.
3. **Split**: active split, preset picker, custom builder, exercise library.
4. **Progress**: exercise charts, PR list, body weight chart.
5. **Calendar**: current-month grid, tap for day log and photos.
6. **Nutrition**: protein goal, log, history.
7. **Profile**: name, photo, email, age, body vitals, units, sign out.

(On small screens, Nutrition and Profile can sit under a "More" tab if five tabs is the limit.)

## 7. Data Model (High Level)

| Entity | Key fields |
| --- | --- |
| User | id, name, email, password_hash, photo_url, age, unit_pref, theme_pref, created_at |
| BodyVital | id, user_id, date, weight, (height) |
| MuscleGroup | id, name |
| Exercise | id, name, muscle_group_id, secondary_muscles, equipment, is_custom, user_id (nullable), archived |
| Split | id, user_id, name, is_preset, is_active |
| SplitDay | id, split_id, weekday, label, is_rest |
| SplitDayExercise | id, split_day_id, exercise_id, order, target_sets, target_reps |
| Workout | id, user_id, split_day_id (nullable), date, started_at, ended_at, duration, notes |
| WorkoutExercise | id, workout_id, exercise_id, order |
| SetLog | id, workout_exercise_id, set_number, weight, reps, is_warmup, estimated_1rm |
| PersonalRecord | id, user_id, exercise_id, type, weight, reps, note, photo_url, created_at (from the device clock), workout_id (nullable) |
| WorkoutPhoto | id, workout_id, user_id, url, created_at |
| NutritionGoal | id, user_id, nutrient, target, multiplier, goal_type, effective_from |
| NutritionEntry | id, user_id, date, nutrient, amount, label |
| Event | id, user_id, type, payload, created_at (for gamification) |

## 8. Non-Functional Requirements

- **Performance:** Logging a set should take two taps or fewer after the exercise is open; screens load in under 2 seconds on a typical mobile connection.
- **Offline:** Workout logging must work offline (gyms often have poor signal) and sync when back online, delivered as an installable progressive web app (PWA) with local caching.
- **Privacy and security:** Photos and body data are private to the user and encrypted in transit and at rest. Account deletion removes all personal data.
- **Accessibility:** Readable contrast, scalable text, and large tap targets for use during workouts. Light and dark themes with a manual toggle in settings.
- **Platforms:** Responsive web app first, usable on phones, tablets and desktop. Native iOS and Android apps are a later consideration.
- **Data integrity:** Editing or deleting past workouts must update charts and streaks consistently.

## 9. Suggested Phasing

### Phase 1: MVP

- Email and password account creation, profile, onboarding (age, weight, height)
- Body vitals with history
- Exercise library, preset and custom splits
- Workout logging with timer
- Calendar with day log and photos
- Protein goal and logging

### Phase 2: Progress

- Charts for weight, volume and estimated 1RM
- Manual PR logging and PR list
- Body weight chart, previous-session reference

### Phase 3: Engagement

- Gamification: streaks, XP and badges
- Expanded nutrition: calories, then meal and food logging with a food database (tracking only)
- Reminders and notifications (not in v1; revisit later)

## 10. Success Metrics

- Onboarding completion rate (sign-in to Home)
- Percentage of users who complete at least 3 logged workouts in their first 2 weeks
- Weekly active users logging at least one workout
- Average time to log a set
- Day-30 retention
- Protein goal logged on at least 3 days a week

## 11. Risks and Assumptions

- **Assumption:** Height is collected in the onboarding step alongside weight, even though the original brief listed only age and weight there, since height is part of body vitals.
- **Risk:** A large exercise library takes effort to seed accurately; start with a curated set and allow custom exercises.
- **Risk:** Editing historical workouts complicates streak and chart recalculation, so design them as derived data that can be rebuilt.
- **Risk:** Photo storage cost and privacy. Decision: cap at 3 photos per day, compress on upload, private by default.

## 12. Decisions Log and Later Items

All questions from the draft are resolved, so nothing blocks v1. The two items below are noted for later.

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Sign-in | Email and password account created once; the session persists until the user logs out |
| 2 | Platform | Responsive web app first (installable PWA) |
| 3 | Units | Metric and imperial at launch, user can switch anytime |
| 4 | Split presets | 5 or more presets plus custom splits |
| 5 | Alternating weeks | Not supported; one fixed weekly routine |
| 6 | Calendar shading | Binary: worked out or not |
| 7 | Protein goal | User sets their own grams-per-kg multiplier (goal type pre-fills a suggestion); goal = body weight × multiplier |
| 8 | Gamification | Mix of streaks, XP and badges (post-v1) |
| 9 | Photo storage | Capped at 3 photos per day, compressed on upload, private |
| 10 | Exercise library seeding | Curated starter set (about 150) plus custom exercises |
| 11 | Editing past workouts | Streaks and charts are derived data and are rebuilt after any edit |
| 12 | Personal records | PRs are logged manually (no auto-detection): heaviest weight lifted or most reps at a given weight; 1RM and volume are charted only |
| 13 | Data export | Deferred until after launch |
| 14 | Timers | Total workout timer only; no rest timer |
| 15 | Nutrition roadmap | Calories next, then meal and food logging with a food database |
| 16 | Theme | Light and dark with a manual toggle |
| 17 | Notifications | None in v1 |
| 18 | App name | Pluto |
| 19 | Nutrition scope | Tracking only; no meal plans, recipes or diet advice |
| 20 | Business model | Free for now; revisit after launch |
| 21 | Streak | Consecutive days with a workout |
| 22 | PR entry | Manual: exercise, weight, reps; date taken from the device; note and photo optional; earns XP later |
| 23 | Progress charts and PR logging | Phase 2 |

**To revisit later:**

- Nutrition after protein: calories, then meal and food logging, tracking only. Detailed requirements are written when that phase starts.
- Business model: the app is free for now; pricing will be revisited after launch.
