# Trumpet Reflex Trainer

Trumpet Reflex Trainer is a mobile-first PWA for beginner B-flat trumpet practice. It trains the mapping between:

- Treble staff notation
- Written note names
- Fixed-do solfege
- Trumpet valve fingerings

## Features

- Seven core reflex-training modes plus mixed practice
- Instrument self-check and phrase self-check drills
- Natural notes, common accidentals, enharmonic spellings, and custom note sets
- Immediate answer feedback with concise note explanations
- Weak-note weighting, speed classes, review stats, and targeted drill presets
- English, Chinese, and bilingual UI
- Light, dark, and system-following appearance modes
- Local-only persistence with `localStorage` and IndexedDB
- Installable offline-capable PWA

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- VexFlow
- `idb`
- `vite-plugin-pwa`

## Local Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run test
npm run build
```

## Deployment

The app builds as a static Vite site and is ready for Vercel deployment.
