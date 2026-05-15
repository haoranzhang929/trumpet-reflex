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
    const height = 192;
    const renderer = new Renderer(container, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    const notationColor = highlight === "correct" ? "#34C759" : highlight === "wrong" ? "#FF3B30" : "#1D1D1F";
    context.setFillStyle("#1D1D1F");
    context.setStrokeStyle("#1D1D1F");

    const staveWidth = size === "large" ? (isPhrase ? 286 : 232) : isPhrase ? 270 : isMulti ? 245 : 190;
    const staveX = Math.round((width - staveWidth) / 2);
    const staveY = size === "large" ? 34 : 28;
    const stave = new Stave(staveX, staveY, staveWidth);
    if (showClef) stave.addClef("treble");
    stave.setContext(context).draw();

    const visibleNotes = displayNotes.map((item) => {
      const staveNote = new StaveNote({ clef: "treble", keys: [item.staff.vexflowKey], duration: "q" });
      staveNote.setStyle({ fillStyle: notationColor, strokeStyle: notationColor });
      staveNote.setStemStyle({ fillStyle: notationColor, strokeStyle: notationColor });
      if (item.written.accidental) {
        const accidental = new Accidental(item.written.accidental);
        accidental.setStyle({ fillStyle: notationColor, strokeStyle: notationColor });
        staveNote.addModifier(accidental, 0);
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
    new Formatter().joinVoices([voice]).format([voice], staveWidth - (isPhrase ? 64 : 88));
    voice.draw(context, stave);
  }, [displayNotes, highlight, showClef, size]);

  const ariaLabel = displayNotes.length > 1
    ? `${t(language, "staffNotesAria")} ${displayNotes.map((item) => item.displayName).join(language === "zh" ? "、" : " and ")}`
    : `${t(language, "staffNoteAria")} ${displayNotes[0]?.displayName ?? ""}`;

  return (
    <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-[#FBFBFD] shadow-inner ring-1 ring-black/10 dark:bg-[#F5F5F7] dark:ring-white/10">
      <div ref={containerRef} aria-label={ariaLabel} />
    </div>
  );
}
