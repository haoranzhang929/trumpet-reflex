import { useEffect, useMemo, useRef } from "react";
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from "vexflow";
import type { AppSettings, StaffSpelling } from "../types";
import { t } from "../i18n";

type Props = {
  note?: StaffSpelling;
  notes?: StaffSpelling[];
  showClef?: boolean;
  size?: "normal" | "large";
  highlight?: "correct" | "wrong" | null;
  language?: AppSettings["language"];
};

export function StaffNote({ note, notes, showClef = true, size = "large", highlight = null, language = "en" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayNotes = useMemo(() => notes ?? (note ? [note] : []), [note, notes]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || displayNotes.length === 0) return;
    container.innerHTML = "";

    const isMulti = displayNotes.length > 1;
    const isPhrase = displayNotes.length > 2;
    const width = size === "large" ? 320 : isMulti ? 310 : 260;
    const height = size === "large" ? 176 : 156;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFillStyle(highlight === "correct" ? "#166534" : highlight === "wrong" ? "#991b1b" : "#111827");
    context.setStrokeStyle("#111827");

    const staveWidth = size === "large" ? (isPhrase ? 280 : 220) : isPhrase ? 270 : isMulti ? 245 : 190;
    const staveX = Math.round((width - staveWidth) / 2);
    const staveY = size === "large" ? 46 : 40;
    const stave = new Stave(staveX, staveY, staveWidth);
    if (showClef) stave.addClef("treble");
    stave.setContext(context).draw();

    const visibleNotes = displayNotes.map((item) => {
      const staveNote = new StaveNote({ clef: "treble", keys: [item.staff.vexflowKey], duration: "q" });
      if (item.written.accidental) {
        staveNote.addModifier(new Accidental(item.written.accidental), 0);
      }
      return staveNote;
    });
    const makeSpacer = () => {
      const spacer = new StaveNote({ clef: "treble", keys: ["b/4"], duration: "qr" });
      spacer.setStyle({ fillStyle: "transparent", strokeStyle: "transparent" });
      return spacer;
    };
    const tickables = isMulti ? visibleNotes : [makeSpacer(), visibleNotes[0], makeSpacer()];
    const voice = new Voice({ numBeats: tickables.length, beatValue: 4 }).addTickables(tickables);
    new Formatter().joinVoices([voice]).format([voice], staveWidth - 78);
    voice.draw(context, stave);
  }, [displayNotes, highlight, showClef, size]);

  const ariaLabel = displayNotes.length > 1
    ? `${t(language, "staffNotesAria")} ${displayNotes.map((item) => item.displayName).join(language === "zh" ? "、" : " and ")}`
    : `${t(language, "staffNoteAria")} ${displayNotes[0]?.displayName ?? ""}`;

  return (
    <div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-lg bg-white shadow-inner ring-1 ring-black/5 dark:bg-slate-100">
      <div ref={containerRef} aria-label={ariaLabel} />
    </div>
  );
}
