# B♭ Trumpet Sight-Reading Trainer — Implementation Plan

## 0. Current Implementation Snapshot

Updated: 2026-05-17

This document started as the initial build plan. It now also records the implementation history and current product shape. Completed work is marked with `[x]`; still-open work is marked with `[ ]`.

### Current Product Shape

Trumpet Reflex is now a local-first B♭ trumpet written-pitch reflex trainer with:

- [x] Mobile-first React/Vite/PWA shell.
- [x] Treble staff rendering through VexFlow.
- [x] Letter-name, fixed-do, fingering, mixed, instrument self-check, and phrase self-check practice modes.
- [x] Local IndexedDB attempt/session history.
- [x] Weak-note weighting, slow-note tracking, problem-pair detection, and review recommendations.
- [x] A guided learning path that recommends the next level from local attempt history.
- [x] A 10-minute daily routine that follows the recommended learning-path level.
- [x] Expanded written trumpet range from low register through practical upper range.
- [x] Reference, settings, help, and review screens updated around the progression model.
- [x] Bilingual English/Chinese UI strings with aligned key coverage.

### Recent Upgrade Notes

The May 2026 learning-path upgrade changed the app from a static drill tool into a guided daily practice flow.

Completed in that upgrade:

- [x] Added `progression.ts` to calculate the recommended level from local attempts.
- [x] Added low register, extended natural, practical range, and expanded enharmonic note coverage.
- [x] Updated the home screen with a compact learning-path card.
- [x] Updated the 10-minute routine to use the current recommended level.
- [x] Added richer attempt context: level, active note IDs, answer options, routine step, and hint usage.
- [x] Expanded review to include mistakes by level, hint usage, and routine step breakdown.
- [x] Reworked Reference into a compact fingering index plus collapsible staff-position groups.
- [x] Reworked Settings into grouped defaults, behavior, app preferences, advanced settings, custom note set, and data sections.
- [x] Shortened Help to the current workflow instead of the original long instruction sheet.
- [x] Removed obsolete `answerNotation`, non-functional concert-pitch setting, and stale i18n strings.

### May 17, 2026 Practice QA Fixes

- [x] Timer expiry now stops on the current question and lets the user submit before the drill finishes.
- [x] Learning-path completion now uses attempts recorded for that exact level, so earlier levels no longer accidentally complete later overlapping levels.
- [x] Home quick-start practice now follows the recommended learning-path level instead of the global default level.
- [x] Future path levels remain tappable for exploration but are labeled as free practice until the main path reaches them.
- [x] Removed looping animation from the home 10-minute CTA and bottom Start nav tab to reduce distraction.
- [x] Increased bottom Start nav contrast, especially in dark mode.
- [x] Start tab now surfaces the recommended learning-path level before manual free-practice setup.
- [x] Help dialog now explains that Start separates recommended path practice from manual/free practice.
- [x] Added a PWA update toast so installed users can apply a newly deployed service worker without guessing.
- [x] Added optional haptic answer feedback: one short vibration for correct, two quick pulses for wrong.
- [x] Haptic feedback now detects browser support and explains that iPhone Safari / iOS PWA cannot use web vibration.
- [x] Added startup fallback and a React error boundary so mobile/PWA startup failures show a reload path instead of a blank screen.
- [x] Mobile ready-state feedback no longer shows desktop keyboard shortcuts.
- [x] Open / 0 fingering is visibly selected when no valves are pressed and its label explains that it means no valves.

### Still Open

- [ ] Tune progression thresholds after more real practice data.
- [ ] Add visual progress details for each learning-path level, if the compact card proves too terse.
- [ ] Consider a small trend view for recent 7-day practice history.
- [ ] Consider E2E tests for the main practice loop and review flow.
- [ ] Keep checking mobile layout after every major UI change.

---

## 1. Product Goal

Build a mobile-first Progressive Web App for B♭ trumpet beginners to train the mapping between:

1. Staff notation
2. Letter note names
3. Fixed-do solfege
4. Trumpet valve fingerings

This is a personal practice tool, not a commercial teaching platform. It should be fast to open, usable on iPhone Safari, installable as a PWA, and deployable to Vercel.

Do **not** implement audio, microphone, pitch detection, tuner, recording, or AI features.

---

## 2. Tech Stack

Use:

- Vite
- React
- TypeScript
- Tailwind CSS
- VexFlow for staff notation rendering
- Zustand or React Context for lightweight app state
- localStorage for lightweight settings
- IndexedDB via `idb` for practice sessions and attempts
- `vite-plugin-pwa` for PWA support
- Vercel as deployment target

No backend.  
No authentication.  
No database server.  
No payment.  
No analytics service unless implemented as local-only stats.

---

## 3. App Name

Working title:

**Trumpet Reflex Trainer**

Chinese subtitle:

**B♭ 小号读谱与指法反应训练器**

---

## 4. Core User Flow

The user should be able to:

1. Open the app on phone.
2. Tap “Start 10-minute practice”.
3. Use the last selected training mode by default.
4. See a randomly generated question.
5. Answer by tapping note names, solfege names, or trumpet valves.
6. Get immediate feedback.
7. Continue automatically or manually to the next question.
8. Review accuracy, reaction time, and weak notes.
9. Close the app and come back later with local progress preserved.

---

## 5. Important Product Constraints

### Must Have

- Mobile-first UI.
- Works well on iPhone Safari.
- Installable PWA.
- Deployable to Vercel.
- Uses B♭ trumpet written pitch as default.
- B♭ trumpet specific.
- No audio features.
- No backend.
- No login.
- No server persistence.
- No complex music theory teaching content.

### Must Not Build

Do not build:

- Microphone detection.
- Pitch recognition.
- Singing or humming input.
- Real-time tuner.
- Metronome.
- Courses.
- User accounts.
- Cloud sync.
- Social sharing.
- Payment.
- AI coach.
- Full song library.

---

## 6. Pitch System

Default mode: **B♭ trumpet written pitch**.

The app trains what the player sees on a trumpet part.

Example:

- Written C = shown as C / Do.
- Fingering = open / 0.
- Concert-pitch display is intentionally not part of the current app; the trainer focuses on what the player sees on the written part.

For MVP, keep all question generation and scoring in written pitch.

---

## 7. Canonical Note Data Model

Status: [x] Done.

Create a canonical note registry. The current implementation lives in `src/data/notes.ts`.

```ts
type Valve = 1 | 2 | 3;

type Note = {
  id: string;
  written: {
    step: "C" | "D" | "E" | "F" | "G" | "A" | "B";
    accidental?: "b" | "#" | null;
    octave: number;
    label: string;
  };
  solfegeFixedDo: string;
  staff: {
    clef: "treble";
    vexflowKey: string;
  };
  valves: Valve[];
  displayName: string;
  levelTags: string[];
  isAnchor?: boolean;
};
```

### Initial Natural Note Set

| Written note | Solfege | Fingering | Staff location |
|---|---|---|---|
| C4 | Do | 0 | Lower ledger line C |
| D4 | Re | 1+3 | Space below first line |
| E4 | Mi | 1+2 | First line |
| F4 | Fa | 1 | First space |
| G4 | Sol | 0 | Second line |
| A4 | La | 1+2 | Second space |
| B4 | Si | 2 | Third line |
| C5 | Do | 0 | Third space |

### Common Accidental Extension

| Written note | Solfege display | Fingering |
|---|---|---|
| F#4 / Gb4 | Fa♯ / Sol♭ | 2 |
| Bb4 / A#4 | Si♭ / La♯ | 1 |
| Eb4 / D#4 | Mi♭ / Re♯ | 2+3 |
| Ab4 / G#4 | La♭ / Sol♯ | 2+3 |
| C#4 / Db4 | Do♯ / Re♭ | 1+2+3 |

For the first implementation, support **fixed-do solfege only**. Do not implement movable-do.

### Current Expanded Note Set

Status: [x] Done.

The first implementation supported C4 through C5 plus common accidentals. The current implementation has been expanded for the learning path:

- Low natural notes: G3, A3, B3.
- Core natural notes: C4 through C5.
- Upper natural notes: D5 through C6.
- Low accidentals: F#3/Gb3, G#3/Ab3, A#3/Bb3.
- Common middle-register accidentals: Bb4, F#4, Eb4, Ab4, C#4.
- Upper accidentals through Bb5.
- Enharmonic spellings are represented as separate written spellings where useful.

All question generation and scoring remain in **B♭ trumpet written pitch**.

---

## 8. Training Modes

Status: [x] Done, with additional self-check modes.

Implemented modes:

- [x] Staff → Letter Name
- [x] Staff → Solfege
- [x] Letter Name → Fingering
- [x] Solfege → Fingering
- [x] Staff → Fingering
- [x] Fingering → Letter Name
- [x] Mixed Mode
- [x] Instrument Self-Check
- [x] Phrase Self-Check

### 8.1 Staff → Letter Name

Question shows staff notation. User answers with C, D, E, F, G, A, B.

When accidentals are enabled, show chromatic options.

### 8.2 Staff → Solfege

Question shows staff notation. User answers with fixed-do solfege: Do, Re, Mi, Fa, Sol, La, Si.

For accidentals, display altered names such as Do♯ / Re♭, Fa♯ / Sol♭, Si♭ / La♯.

Do not implement movable-do in MVP.

### 8.3 Letter Name → Fingering

Question shows a written note name. User taps trumpet valves.

Example: `E → 1+2`

### 8.4 Solfege → Fingering

Question shows fixed-do solfege.

Example: `Mi → 1+2`

### 8.5 Staff → Fingering

Question shows staff notation. User taps valves directly.

This is the main practice mode.

### 8.6 Fingering → Letter Name

Question shows a valve combination. User selects possible written note names from the current level.

Important: trumpet fingerings are ambiguous across partials, so restrict answers to the active level/range.

### 8.7 Mixed Mode

Randomly choose from:

- Staff → Letter
- Staff → Solfege
- Letter → Fingering
- Solfege → Fingering
- Staff → Fingering

Mixed mode should be the default daily practice mode after onboarding.

---

## 9. Difficulty Levels

Status: [x] Done, later expanded into a learning path.

The original MVP levels are still present, but the app now uses a broader level ladder for progression.

### Level 1: Anchor Notes

Notes:

- C4
- F4
- G4
- C5

Purpose: train landmarks: lower ledger C, first space F, second line G, third space C.

### Level 2: C D E

Notes: C4, D4, E4.

Purpose: train lower beginner range.

### Level 3: C to G

Notes: C4, D4, E4, F4, G4.

### Level 4: Natural C to C

Notes: C4, D4, E4, F4, G4, A4, B4, C5.

This should be the default once the app is usable.

### Level 5: Common Accidentals

Add: Bb4, F#4, Eb4, Ab4, C#4.

### Level 6: Custom Note Set

User can manually select which notes appear.

Use checkboxes grouped by natural notes, flats, sharps, anchor notes, and weak notes.

### Current Level Ladder

Status: [x] Done.

Current `DifficultyLevel` values:

1. `anchors`: C4, F4, G4, C5.
2. `cde`: C4, D4, E4.
3. `c-to-g`: C4 through G4.
4. `natural-c-to-c`: C4 through C5.
5. `low-register`: G3, A3, B3 plus C4 through C5.
6. `common-accidentals`: C4 through C5 plus Bb4, F#4, Eb4, Ab4, C#4.
7. `extended-natural`: G3 through C6 natural notes.
8. `practical-range`: practical written trumpet range from low F#3 through upper accidentals.
9. `enharmonic-spellings`: natural range plus enharmonic spellings.
10. `custom`: user-selected note set.

### Progression System

Status: [x] Done.

`src/features/practice/progression.ts` computes the current recommended level from local attempts.

The current rule considers:

- Scope: modern attempts count toward the level that was active when the question was answered. Legacy attempts without level metadata use note overlap as a fallback only.
- Coverage: enough notes in the level have been attempted.
- Volume: enough total attempts exist for the level.
- Accuracy: target is currently 85% or higher.
- Speed: median correct response should be reasonably fast.

The home screen displays a compact learning-path card. The full path is collapsed by default to keep the first screen focused.

Home quick-start buttons use the recommended learning-path level by default, so casual practice continues the main path. Drill presets and custom note-set practice remain `custom` and do not complete learning-path levels. Later path levels are still tappable for exploratory practice, but the UI labels not-yet-reached levels as free practice rather than implying they are part of the current progression step.

---

## 10. Practice Session Types

Status: [x] Done.

### Quick Drill

- No timer.
- Unlimited questions.
- Useful for casual use.

### 3-Minute Drill

- Timer: 3 minutes.
- Good for quick warm-up.

### 5-Minute Drill

- Timer: 5 minutes.

### 10-Minute Drill

- Timer: 10 minutes.
- Main target use case.
- Current behavior: the home CTA starts a five-step 10-minute routine using the learning path's recommended level.
- Steps: Staff → Letter, Letter → Fingering, Staff → Fingering, Instrument Self-Check, Weak Notes Review.

### Weak Notes Drill

Only uses notes where the user has low accuracy, slow median reaction time, or frequent recent mistakes.

---

## 11. Question Generation Logic

Status: [x] Done.

Implement weighted random generation.

```ts
type QuestionGenerationOptions = {
  mode: TrainingMode;
  level: DifficultyLevel;
  selectedNoteIds?: string[];
  weakNoteBias: boolean;
  avoidImmediateRepeat: boolean;
};
```

Rules:

1. [x] Select notes from active level or custom note set.
2. [x] If weak note bias is enabled, increase probability for weak notes.
3. [x] Avoid generating the exact same note twice in a row unless the note pool is tiny.
4. [x] For mixed mode, randomize mode first, then generate note.
5. [x] For fingering → note mode, only ask from active note set because trumpet fingerings repeat across registers.
6. [x] For phrase self-check, generate a short sequence and record all note IDs.

Suggested weak note score:

```ts
weaknessScore =
  wrongCount * 3
  + slowCount * 1
  + recentWrongCount * 4
  - recentCorrectStreak * 1;
```

Simple weight:

```ts
weight = 1 + Math.min(weaknessScore, 10);
```

---

## 12. Answer Input UI

Status: [x] Done.

### 12.1 Letter Name Input

Render large buttons: C, D, E, F, G, A, B.

When accidentals are enabled, render chromatic options.

### 12.2 Solfege Input

Render large buttons: Do, Re, Mi, Fa, Sol, La, Si.

For accidentals, show Do♯ / Re♭, Fa♯ / Sol♭, Si♭ / La♯.

### 12.3 Valve Input

Render a trumpet valve pad.

Mobile layout:

```text
[ 1 ] [ 2 ] [ 3 ]

[ Open / 0 ]     [ Submit ]
```

Valve buttons toggle selected state.

Examples:

- No valves selected + Submit = 0 / open.
- 1 + 2 selected + Submit = 1+2.
- 1 + 3 selected + Submit = 1+3.

Do not auto-submit on valve press. User must tap Submit.

Desktop keyboard shortcuts:

- `1` toggles valve 1.
- `2` toggles valve 2.
- `3` toggles valve 3.
- `0` clears all valves / open.
- `Enter` submits.
- `Space` goes to next question.
- `H` toggles hint.

---

## 13. Feedback Behavior

Status: [x] Done.

### Correct Answer

- Green state.
- Show “Correct”.
- Show note name, solfege, and fingering.
- Auto-advance after 500–700ms if setting enabled.

### Wrong Answer

- Red state.
- Show selected answer.
- Show correct answer.
- Show note name, solfege, fingering, staff location.
- Do not auto-advance immediately; wait at least 1200ms or require Next.

Example:

```text
Wrong.
This is written B / Si.
Fingering: 2.
Staff: third line.
```

For staff notation questions, include landmark explanation if hints are enabled:

```text
Third line B is just below third-space C.
```

---

## 14. Hint System

Status: [x] Done, simplified.

Implement a lightweight hint system.

```ts
type HintSettings = {
  showStaffLandmarks: boolean;
  showLetterAfterWrong: boolean;
  showSolfegeAfterWrong: boolean;
  showFingeringAfterWrong: boolean;
};
```

Default:

- [x] Show hints after wrong answer: yes.
- [x] Show hints before answer: user can toggle with the Hint button or `H`.
- [x] Record whether a hint was shown before an attempt for future review.
- [x] Concert pitch reference was removed because the setting had no functional UI and the app intentionally trains written pitch.

### Landmark Hints

| Note | Hint |
|---|---|
| C4 | Lower ledger line C |
| F4 | FACE: first space F |
| G4 | Second line G |
| B4 | Third line B |
| C5 | FACE: third space C |

For non-anchor natural notes, show relative hints:

- D4: between lower ledger C and first-line E.
- E4: first line E.
- A4: FACE second space A.

---

## 15. Staff Rendering

Status: [x] Done.

Use VexFlow.

Create a reusable component:

```tsx
<StaffNote
  note={note}
  showClef={true}
  showAccidental={true}
  size="large"
/>
```

Requirements:

- Render treble clef.
- Render one note at a time.
- Support C4 lower ledger line.
- Support C5 third space.
- Support accidentals.
- Responsive on mobile.
- Use SVG rendering.
- Avoid layout shift between questions.

Recommended behavior:

- Fixed staff container height.
- Large enough for phone screens.
- Center note horizontally.
- Optional note highlight after answer.

---

## 16. App Views

Use a simple single-page app with internal views.

### 16.1 Home

Status: [x] Done and updated for progression.

Sections:

- [x] Start 10-minute recommended routine.
- [x] Questions / accuracy / last-session summary.
- [x] Today's focus and weak-note shortcut.
- [x] Compact learning-path card with full path collapsed by default.
- [x] Quick practice shortcuts.
- [x] Drill presets.

### 16.2 Practice

Status: [x] Done.

Contains:

- [x] Header: mode, level, timer, progress.
- [x] Staff/question display.
- [x] Answer input.
- [x] Feedback.
- [x] Hint toggle.
- [x] Pause/end session.
- [x] Routine step indicator for the 10-minute flow.

### 16.3 Review

Status: [x] Done and expanded.

After session:

- [x] Total questions.
- [x] Accuracy.
- [x] Median reaction time.
- [x] Average reaction time.
- [x] Max correct streak.
- [x] Weak notes.
- [x] Slow-but-correct notes.
- [x] Slowest correct notes.
- [x] Problem pairs.
- [x] Mistakes by mode.
- [x] Mistakes by level.
- [x] 10-minute routine step breakdown.
- [x] Hint usage count.
- [x] Practice weak notes.

### 16.4 Settings

Settings:

- [x] Display language: English / Chinese.
- [x] Theme: system / light / dark.
- [x] Solfege system: fixed-do only.
- [x] Auto-advance after correct answer.
- [x] Show hints after wrong answer.
- [x] Weak-note weighting.
- [x] Default session length.
- [x] Default level.
- [x] Phrase length.
- [x] Advanced thresholds for fast/slow answer classification.
- [x] Accidentals setting for custom note filtering.
- [x] Custom note set, grouped and collapsed by default.
- [x] Export, import, and reset local data.
- [x] Removed obsolete answer-notation and concert-pitch settings.

### 16.5 Reference

Static reference page:

- [x] Compact fingering quick index.
- [x] Staff location → letter name.
- [x] Letter name → fixed-do solfege.
- [x] Low, core, upper, accidental, and enharmonic sections.
- [x] Collapsible groups to avoid a long wall of reference content.
- [x] Explanation of B♭ trumpet written pitch.
- [x] Concise reference only. No long lessons.

---

## 17. Data Persistence

Status: [x] Done.

Use localStorage for lightweight settings.

Use IndexedDB for sessions and attempts.

### Settings

```ts
type AppSettings = {
  language: "en" | "zh";
  theme: "system" | "light" | "dark";
  defaultMode: TrainingMode | "mixed";
  defaultLevel: DifficultyLevel;
  defaultSessionLengthSec: 0 | 180 | 300 | 600;
  autoAdvanceCorrect: boolean;
  hintsAfterWrong: boolean;
  accidentalsEnabled: boolean;
  weakNoteBias: boolean;
  selectedNoteIds: string[];
  phraseLength: 3 | 4 | 5;
  veryFastThresholdMs: number;
  slowThresholdMs: number;
};
```

### Practice Session

```ts
type PracticeSession = {
  id: string;
  startedAt: number;
  endedAt?: number;
  mode: TrainingMode | "mixed";
  level: DifficultyLevel;
  totalQuestions: number;
  correctCount: number;
  medianReactionMs: number;
  averageReactionMs: number;
  maxStreak: number;
};
```

### Attempt

```ts
type Attempt = {
  id: string;
  sessionId: string;
  questionMode: TrainingMode;
  level?: DifficultyLevel;
  activeNoteIds?: string[];
  answerOptions?: string[];
  routineStepId?: string;
  routineStepIndex?: number;
  routineStepTotal?: number;
  hintShown?: boolean;
  noteId?: string;
  noteIds?: string[];
  isPhrase?: boolean;
  shownPromptType: "staff" | "letter" | "solfege" | "fingering";
  expectedAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  reactionMs: number;
  speedClass?: "fast-correct" | "normal-correct" | "slow-correct" | "wrong";
  inputMethod?: "tap" | "keyboard" | "self-check";
  selfChecked?: boolean;
  revealedBeforeAnswer?: boolean;
  createdAt: number;
};
```

### Derived Note Stats

Compute from attempts rather than permanently duplicating too much data.

```ts
type NoteStats = {
  noteId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  medianReactionMs: number;
  wrongCount: number;
  slowCorrectCount: number;
  fastCorrectCount: number;
  slowCount: number;
  recentWrongCount: number;
  recentSlowCorrectCount: number;
  currentCorrectStreak: number;
  recentFastCorrectStreak: number;
  weaknessScore: number;
};
```

---

## 18. Local-First Data Rules

- [x] App must work offline after first load.
- [x] App must not require network during practice.
- [x] User data remains local.
- [x] Provide “Export JSON” in settings.
- [x] Provide “Import JSON” in settings.
- [x] Provide “Reset all data” with confirmation.

---

## 19. PWA Requirements

Status: [x] Done.

Use `vite-plugin-pwa`.

Manifest:

```json
{
  "name": "Trumpet Reflex Trainer",
  "short_name": "TrumpetTrainer",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#111111",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Start Mixed Drill",
      "url": "/?mode=mixed"
    },
    {
      "name": "Weak Notes",
      "url": "/?view=weak-notes"
    }
  ]
}
```

Service worker:

- Cache app shell.
- Cache static assets.
- Runtime caching for app resources.
- App should show an offline-ready state.

---

## 20. Styling Direction

Status: [x] Done, with ongoing polish.

Use a clean, calm, practice-tool style.

Avoid gamified childish UI.

Design principles:

- Large tap targets.
- High contrast.
- Minimal distraction.
- Clear feedback.
- Works one-handed on iPhone.
- Good dark mode support.

Suggested visual style:

- Background: warm off-white or dark slate.
- Cards with rounded corners.
- Large staff display.
- Large valve buttons.
- Clear green/red feedback.
- Minimal animations.

Use Tailwind CSS.

Support light and dark mode.

---

## 21. Suggested Component Structure

Status: [x] Mostly done. Current structure differs slightly from the original suggestion but follows the same feature boundaries.

```text
src/
  app/
    App.tsx
    routes.ts
  components/
    StaffNote.tsx
    ValvePad.tsx
    LetterAnswerGrid.tsx
    SolfegeAnswerGrid.tsx
    PracticeHeader.tsx
    FeedbackPanel.tsx
    Timer.tsx
    StatCard.tsx
    WeakNotesList.tsx
  features/
    practice/
      PracticeView.tsx
      questionGenerator.ts
      answerChecker.ts
      sessionStats.ts
      progression.ts
      phraseGenerator.ts
      todaySession.ts
    reference/
      ReferenceView.tsx
    settings/
      SettingsView.tsx
    review/
      ReviewView.tsx
  data/
    notes.ts
    fingerings.ts
    solfege.ts
    levels.ts
  storage/
    db.ts
    settingsStorage.ts
    exportImport.ts
  pwa/
    registerServiceWorker.ts
  utils/
    time.ts
    stats.ts
    random.ts
    trumpetPitch.ts
```

---

## 22. Practice State Machine

Status: [x] Done with React state/hooks rather than a separate machine file.

Practice flow should be explicit.

```ts
type PracticeState =
  | "idle"
  | "showingQuestion"
  | "answeredCorrect"
  | "answeredWrong"
  | "paused"
  | "finished";
```

Question lifecycle:

1. Generate question.
2. Render prompt.
3. Start reaction timer.
4. User submits answer.
5. Stop reaction timer.
6. Check answer.
7. Save attempt.
8. Show feedback.
9. Advance to next question or finish session.

---

## 23. Answer Checking

Status: [x] Done.

Use normalized answer comparison.

Examples:

- Fingering `[]` equals `"0"` or `"open"`.
- Fingering `[1,2]` equals `"1+2"`.
- Letter `Bb` equals `B♭`.
- Sharp/flat display variants normalize internally.

Implement:

```ts
normalizeLetterAnswer(input: string): string;
normalizeSolfegeAnswer(input: string): string;
normalizeValveAnswer(input: Valve[]): string;
checkAnswer(question: Question, userAnswer: UserAnswer): AnswerResult;
```

---

## 24. Testing Requirements

Status: [x] Unit tests done. [ ] E2E tests still open.

Use Vitest for pure logic.

Test:

- [x] Note registry correctness.
- [x] Fingering mapping correctness.
- [x] Level note selection.
- [x] Random question generation avoids immediate repeat.
- [x] Weak note weighting.
- [x] Answer normalization.
- [x] Staff-to-letter checking.
- [x] Staff-to-solfege checking.
- [x] Staff-to-fingering checking.
- [x] Session stats calculation.
- [x] Median reaction time calculation.
- [x] Phrase generation.
- [x] Recommendation logic.
- [x] Learning-path progression.

Use Playwright if practical for E2E.

E2E smoke tests:

1. [ ] App loads.
2. [ ] Start practice.
3. [ ] Answer a staff → fingering question.
4. [ ] Feedback appears.
5. [ ] Attempt is saved.
6. [ ] Review page shows stats.
7. [ ] Refresh page preserves settings.

Manual browser smoke checks have been used during development for Home, Help, Ref, Review, and Settings.

---

## 25. Acceptance Criteria

### Functional

- [x] User can start a practice session.
- [x] User can train staff → letter.
- [x] User can train staff → solfege.
- [x] User can train letter → fingering.
- [x] User can train solfege → fingering.
- [x] User can train staff → fingering.
- [x] User can use mixed mode.
- [x] User can use instrument self-check.
- [x] User can use phrase self-check.
- [x] User can change difficulty level.
- [x] User can follow a recommended learning path.
- [x] User can answer using touch.
- [x] User can answer using keyboard.
- [x] User can review session stats.
- [x] User can see weak notes.
- [x] User can practice weak notes.
- [x] User can view reference chart.
- [x] User can reset local data.

### Technical

- [x] TypeScript builds without errors.
- [x] No backend required.
- [x] No microphone permission requested.
- [x] App deploys to Vercel.
- [ ] App works on mobile Safari. Needs continued real-device checking.
- [x] App works after refresh.
- [x] App supports PWA install.
- [x] App has basic offline support.
- [x] Core logic has unit tests.

### UX

- [x] Main practice loop is usable with one hand.
- [x] Buttons are large enough on phone.
- [x] Staff notation is readable.
- [x] Feedback is immediate and clear.
- [x] Wrong answer explains the correct mapping.
- [x] User can complete a 10-minute session without friction.
- [x] Home, Help, Ref, Settings, and Review were simplified after real use.

---

## 26. Vercel Deployment

Status: [x] Done.

Add scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint ."
  }
}
```

Vercel settings:

- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Install command: `npm install`.

No serverless functions needed.

---

## 27. First Build Priority

Implement in this order:

- [x] Project setup.
- [x] Note registry and fingering data.
- [x] Question generator.
- [x] Answer checker.
- [x] VexFlow staff rendering.
- [x] Practice view.
- [x] Valve pad input.
- [x] Letter and solfege answer grids.
- [x] Session timer.
- [x] Attempt recording.
- [x] Review stats.
- [x] Weak notes drill.
- [x] Settings.
- [x] Reference page.
- [x] PWA support.
- [x] Vercel deployment config.
- [x] Unit tests.
- [x] Mobile polish pass.
- [x] Learning path progression upgrade.
- [x] Expanded practical note range.
- [x] Reference/settings/help cleanup.

---

## 28. Do Not Overbuild

Do not add:

- Audio detection.
- AI explanations.
- User accounts.
- Backend.
- Payments.
- Complex course system.
- Full song library.
- Social features.
- Teacher dashboard.

This app should remain a fast, local-first, personal trumpet reflex trainer.

---

## 29. Final Expected Outcome

A deployed Vercel PWA where the user can open the app on phone and practice for 10 minutes:

- [x] Reading staff notes.
- [x] Identifying letter names.
- [x] Identifying fixed-do solfege.
- [x] Mapping notes to B♭ trumpet valves.
- [x] Reviewing weak notes.
- [x] Gradually expanding from anchor notes to natural notes and common accidentals.
- [x] Continuing beyond the original MVP into low register, extended natural notes, and practical range stages.

The main success criterion is not feature quantity. The main success criterion is that the app makes daily 10-minute trumpet reading practice frictionless.

---

## 30. Implementation Log

### Initial MVP

Completed:

- [x] Vite/React/TypeScript/Tailwind project setup.
- [x] PWA manifest and service worker.
- [x] Local settings persistence.
- [x] IndexedDB sessions and attempts.
- [x] Core note registry for C4 through C5.
- [x] Common accidentals and enharmonic spellings.
- [x] Practice modes and answer checking.
- [x] VexFlow staff rendering.
- [x] Review stats and weak-note weighting.
- [x] Settings, Reference, and Review pages.

### Practice Experience Expansion

Completed:

- [x] Instrument Self-Check mode.
- [x] Phrase Self-Check mode.
- [x] Today's 10-minute five-step routine.
- [x] Speed classes for fast, normal, slow, and wrong answers.
- [x] Richer review recommendations.

### Learning Path Upgrade

Completed:

- [x] Expanded note registry to practical written trumpet range.
- [x] Added low register, extended natural, practical range, and enhanced enharmonic levels.
- [x] Added progression summary and recommended-level calculation.
- [x] Home screen learning-path card.
- [x] 10-minute routine now follows the recommended level.
- [x] Attempt records now include richer context for future review.
- [x] Review now reports mistakes by level and 10-minute routine step stats.
- [x] Reference page changed from a long chart into a compact fingering index plus collapsible staff sections.
- [x] Settings page reorganized and long custom note set collapsed.
- [x] Help dialog rewritten around the current workflow.
- [x] Removed obsolete settings and stale i18n keys.

### Practice QA Fixes

Completed:

- [x] Timer expiry changed from immediate session finish to "time is up, submit this question, then finish."
- [x] Progression completion fixed so CDE/anchor work does not mark C to G and broader overlapping levels as mastered.
- [x] Home quick-start buttons now carry the current recommended level into Mixed, Instrument Self-Check, Phrase Self-Check, and Weak Notes practice.
- [x] The expanded learning path now distinguishes free-practice future levels from the current recommended level.
- [x] Home 10-minute CTA and bottom Start nav tab now use static emphasis rather than looping beam/spin animations.
- [x] Bottom Start nav tab now uses higher-contrast static colors.
- [x] Start tab now includes a learning-path recommendation card so it no longer feels disconnected from progression.
- [x] Help dialog updated to mention Start tab progression and free-practice behavior.
- [x] PWA registration now exposes service-worker update events and shows an in-app update prompt.
- [x] Settings now include a haptic feedback toggle for mobile answer feedback.
- [x] Fingering Open / 0 button now has a visible selected state when no valves are pressed.
- [x] Mobile ready feedback now omits keyboard shortcut copy.

### Current Next Questions

- [ ] Are the progression thresholds too strict or too loose after more daily use?
- [ ] Should Review prioritize the most recent 7 days over lifetime attempts?
- [ ] Should the learning-path card show a clearer "why this level" explanation?
- [ ] Should custom note sets become named saved presets?
- [ ] Should we add a small E2E smoke suite for the main happy path?
