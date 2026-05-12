# B♭ Trumpet Sight-Reading Trainer — Implementation Plan

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
- Optional reference can show: sounding B♭.

For MVP, keep all question generation and scoring in written pitch.

---

## 7. Canonical Note Data Model

Create a canonical note registry.

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

---

## 8. Training Modes

Implement these modes.

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

Implement a level system.

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

---

## 10. Practice Session Types

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

### Weak Notes Drill

Only uses notes where the user has low accuracy, slow median reaction time, or frequent recent mistakes.

---

## 11. Question Generation Logic

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

1. Select notes from active level or custom note set.
2. If weak note bias is enabled, increase probability for weak notes.
3. Avoid generating the exact same note twice in a row unless the note pool is tiny.
4. For mixed mode, randomize mode first, then generate note.
5. For fingering → note mode, only ask from active note set because trumpet fingerings repeat across registers.

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

Implement a lightweight hint system.

```ts
type HintSettings = {
  showStaffLandmarks: boolean;
  showLetterAfterWrong: boolean;
  showSolfegeAfterWrong: boolean;
  showFingeringAfterWrong: boolean;
  showConcertPitchReference: boolean;
};
```

Default:

- Show hints after wrong answer: yes.
- Show hints before answer: no.
- Show concert pitch reference: no.

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

Sections:

- Start 10-minute mixed practice.
- Quick drill.
- Choose mode.
- Current streak.
- Last session summary.
- Weakest notes.

### 16.2 Practice

Contains:

- Header: mode, level, timer, progress.
- Staff/question display.
- Answer input.
- Feedback.
- Hint toggle.
- Pause/end session.

### 16.3 Review

After session:

- Total questions.
- Accuracy.
- Median reaction time.
- Average reaction time.
- Max correct streak.
- Weak notes.
- Mistakes by mode.
- Button: Practice weak notes.

### 16.4 Settings

Settings:

- Display language: English / Chinese / bilingual.
- Answer notation: Letter / Solfege / Both.
- Solfege system: Fixed-do only for now.
- Auto-advance after correct answer.
- Show hints after wrong answer.
- Default session length.
- Default level.
- Enable accidentals.
- Reset local data.

### 16.5 Reference

Static reference page:

- Written note → fingering chart.
- Staff location → letter name.
- Letter name → solfege.
- Explanation of B♭ trumpet written pitch.
- Concise reference only. No long lessons.

---

## 17. Data Persistence

Use localStorage for lightweight settings.

Use IndexedDB for sessions and attempts.

### Settings

```ts
type AppSettings = {
  language: "en" | "zh" | "bilingual";
  defaultMode: TrainingMode;
  defaultLevel: DifficultyLevel;
  defaultSessionLengthSec: 0 | 180 | 300 | 600;
  answerNotation: "letter" | "solfege" | "both";
  autoAdvanceCorrect: boolean;
  hintsAfterWrong: boolean;
  showConcertPitchReference: boolean;
  accidentalsEnabled: boolean;
  weakNoteBias: boolean;
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
  noteId: string;
  shownPromptType: "staff" | "letter" | "solfege" | "fingering";
  expectedAnswer: string;
  userAnswer: string;
  isCorrect: boolean;
  reactionMs: number;
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
  recentWrongCount: number;
  currentCorrectStreak: number;
  weaknessScore: number;
};
```

---

## 18. Local-First Data Rules

- App must work offline after first load.
- App must not require network during practice.
- User data remains local.
- Provide “Export JSON” in settings.
- Provide “Import JSON” in settings.
- Provide “Reset all data” with confirmation.

---

## 19. PWA Requirements

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
      practiceMachine.ts
      questionGenerator.ts
      answerChecker.ts
      sessionStats.ts
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

Use Vitest for pure logic.

Test:

- Note registry correctness.
- Fingering mapping correctness.
- Level note selection.
- Random question generation avoids immediate repeat.
- Weak note weighting.
- Answer normalization.
- Staff-to-letter checking.
- Staff-to-solfege checking.
- Staff-to-fingering checking.
- Session stats calculation.
- Median reaction time calculation.

Use Playwright if practical for E2E.

E2E smoke tests:

1. App loads.
2. Start practice.
3. Answer a staff → fingering question.
4. Feedback appears.
5. Attempt is saved.
6. Review page shows stats.
7. Refresh page preserves settings.

---

## 25. Acceptance Criteria

### Functional

- User can start a practice session.
- User can train staff → letter.
- User can train staff → solfege.
- User can train letter → fingering.
- User can train solfege → fingering.
- User can train staff → fingering.
- User can use mixed mode.
- User can change difficulty level.
- User can answer using touch.
- User can answer using keyboard.
- User can review session stats.
- User can see weak notes.
- User can practice weak notes.
- User can view reference chart.
- User can reset local data.

### Technical

- TypeScript builds without errors.
- No backend required.
- No microphone permission requested.
- App deploys to Vercel.
- App works on mobile Safari.
- App works after refresh.
- App supports PWA install.
- App has basic offline support.
- Core logic has unit tests.

### UX

- Main practice loop is usable with one hand.
- Buttons are large enough on phone.
- Staff notation is readable.
- Feedback is immediate and clear.
- Wrong answer explains the correct mapping.
- User can complete a 10-minute session without friction.

---

## 26. Vercel Deployment

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

1. Project setup.
2. Note registry and fingering data.
3. Question generator.
4. Answer checker.
5. VexFlow staff rendering.
6. Practice view.
7. Valve pad input.
8. Letter and solfege answer grids.
9. Session timer.
10. Attempt recording.
11. Review stats.
12. Weak notes drill.
13. Settings.
14. Reference page.
15. PWA support.
16. Vercel deployment config.
17. Unit tests.
18. Mobile polish.

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

- Reading staff notes.
- Identifying letter names.
- Identifying fixed-do solfege.
- Mapping notes to B♭ trumpet valves.
- Reviewing weak notes.
- Gradually expanding from anchor notes to natural notes and common accidentals.

The main success criterion is not feature quantity. The main success criterion is that the app makes daily 10-minute trumpet reading practice frictionless.
