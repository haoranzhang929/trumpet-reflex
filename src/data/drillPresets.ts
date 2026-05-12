import type { TrainingMode } from "../types";

export type DrillPreset = {
  id: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  noteIds: string[];
  allowedModes: TrainingMode[];
  recommendedMode: TrainingMode;
};

const fingeringModes: TrainingMode[] = ["staff-fingering", "letter-fingering", "solfege-fingering", "instrument-self-check", "phrase-self-check"];

export const drillPresets: DrillPreset[] = [
  {
    id: "anchor-notes",
    title: "Anchor Notes Drill",
    titleZh: "锚点音专项",
    description: "Train landmark notes.",
    descriptionZh: "训练关键定位音。",
    noteIds: ["c4", "f4", "g4", "c5"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "lower-face",
    title: "Lower FACE Drill",
    titleZh: "低音区 FACE 专项",
    description: "Train FACE spaces in the supported beginner range.",
    descriptionZh: "训练当前范围内的 FACE 间位置。",
    noteIds: ["f4", "a4", "c5"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-letter"
  },
  {
    id: "lower-lines",
    title: "Lower Line Notes Drill",
    titleZh: "低音区线音专项",
    description: "Train line notes in the beginner range.",
    descriptionZh: "训练初学范围内的线音。",
    noteIds: ["e4", "g4", "b4"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-letter"
  },
  {
    id: "open-notes",
    title: "Open Notes Drill",
    titleZh: "开放指法专项",
    description: "Train open fingering notes.",
    descriptionZh: "训练开放指法音。",
    noteIds: ["c4", "g4", "c5"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "one-two",
    title: "1+2 Drill",
    titleZh: "1+2 指法专项",
    description: "Train notes sharing 1+2 fingering.",
    descriptionZh: "训练同为 1+2 指法的音。",
    noteIds: ["e4", "a4"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "d-vs-e",
    title: "D vs E Drill",
    titleZh: "D / E 对比",
    description: "Train 1+3 vs 1+2.",
    descriptionZh: "训练 1+3 和 1+2 的区分。",
    noteIds: ["d4", "e4"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "a-vs-b",
    title: "A vs B Drill",
    titleZh: "A / B 对比",
    description: "Train 1+2 vs 2.",
    descriptionZh: "训练 1+2 和 2 的区分。",
    noteIds: ["a4", "b4"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "f-vs-b",
    title: "F vs B Drill",
    titleZh: "F / B 对比",
    description: "Train 1 vs 2.",
    descriptionZh: "训练 1 和 2 的区分。",
    noteIds: ["f4", "b4"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "common-trumpet-accidentals",
    title: "Common Trumpet Accidentals Drill",
    titleZh: "常见小号变化音专项",
    description: "Train practical early accidentals.",
    descriptionZh: "训练早期最常见的小号变化音。",
    noteIds: ["bb4", "fs4", "eb4"],
    allowedModes: fingeringModes,
    recommendedMode: "staff-fingering"
  },
  {
    id: "enharmonic-awareness",
    title: "Enharmonic Awareness Drill",
    titleZh: "同音异名专项",
    description: "Train same sound, different spelling awareness.",
    descriptionZh: "训练同一声音、不同谱面拼写的意识。",
    noteIds: ["bb4", "as4", "fs4", "gb4", "eb4", "ds4"],
    allowedModes: fingeringModes,
    recommendedMode: "instrument-self-check"
  }
];
