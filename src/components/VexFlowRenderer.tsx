import React, { useEffect, useRef } from 'react';
import {
  Renderer,
  Stave,
  StaveNote,
  Voice,
  Formatter,
  StaveConnector,
  StaveNoteStruct,
  Annotation
} from 'vexflow';

interface NoteData {
  key: string;
  duration: string;
  lyric?: string;
}

interface VexFlowRendererProps {
  notes: NoteData[];
  width?: number;
  height?: number;
}

export function VexFlowRenderer({ notes, width = 1000, height = 1200 }: VexFlowRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !notes || notes.length === 0) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    // VexFlow duration mapping to ticks (1024 = quarter note)
    const durationMap: Record<string, number> = {
      'w': 4096,
      'h': 2048,
      'q': 1024,
      '8': 512,
      '16': 256
    };

    const TICKS_PER_MEASURE = 4096; // 4/4 time
    const MEASURE_WIDTH = 250;
    const MEASURES_PER_LINE = 3;
    const SYSTEM_HEIGHT = 150;

    let currentTicks = 0;
    let currentMeasureNotes: StaveNote[] = [];
    let allMeasures: StaveNote[][] = [];

    // Group notes into measures
    notes.forEach((noteData) => {
      const vfNote = new StaveNote({
        keys: [noteData.key],
        duration: noteData.duration
      });

      if (noteData.lyric) {
        vfNote.addModifier(new Annotation(noteData.lyric)
          .setVerticalJustification(Annotation.VerticalJustify.BOTTOM));
      }

      const ticks = durationMap[noteData.duration] || 1024;

      if (currentTicks + ticks > TICKS_PER_MEASURE && currentMeasureNotes.length > 0) {
        allMeasures.push(currentMeasureNotes);
        currentMeasureNotes = [];
        currentTicks = 0;
      }

      currentMeasureNotes.push(vfNote);
      currentTicks += ticks;
    });

    if (currentMeasureNotes.length > 0) {
      allMeasures.push(currentMeasureNotes);
    }

    // Render systems
    allMeasures.forEach((mNotes, mIndex) => {
      const lineIndex = Math.floor(mIndex / MEASURES_PER_LINE);
      const colIndex = mIndex % MEASURES_PER_LINE;

      const x = 80 + (colIndex * MEASURE_WIDTH);
      const y = 50 + (lineIndex * SYSTEM_HEIGHT);

      const stave = new Stave(x, y, MEASURE_WIDTH);

      if (colIndex === 0) {
        stave.addClef('treble').addTimeSignature('4/4').addKeySignature('G');

        // Add the "S" label for the first stave of each line
        stave.setSection('S', 0);

        // Draw beginning-of-line connectors
        const connector = new StaveConnector(stave, stave);
        connector.setType(StaveConnector.type.BRACKET);
        connector.setContext(context).draw();

        const lineConnector = new StaveConnector(stave, stave);
        lineConnector.setType(StaveConnector.type.SINGLE_LEFT);
        lineConnector.setContext(context).draw();
      }

      stave.setContext(context).draw();

      const voice = new Voice({ numBeats: 4, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickables(mNotes);

      new Formatter().joinVoices([voice]).format([voice], MEASURE_WIDTH - (colIndex === 0 ? 80 : 20));
      voice.draw(context, stave);
    });

  }, [notes, width, height]);

  return <div ref={containerRef} className="flex justify-center p-4 bg-white" />;
}
