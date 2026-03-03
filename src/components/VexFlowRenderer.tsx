import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';

interface VexFlowRendererProps {
  notes: string[]; // e.g., ['c/4', 'd/4', 'e/4', 'f/4']
  width?: number;
  height?: number;
}

export function VexFlowRenderer({ notes, width = 500, height = 150 }: VexFlowRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous render
    containerRef.current.innerHTML = '';

    // Create an SVG renderer and attach it to the DIV element
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);

    // Configure the rendering context
    renderer.resize(width, height);
    const context = renderer.getContext();

    // Create a stave of width 400 at position 10, 40 on the canvas
    const stave = new Stave(10, 40, width - 20);

    // Add a clef and time signature
    stave.addClef('treble').addTimeSignature('4/4');

    // Connect it to the rendering context and draw
    stave.setContext(context).draw();

    if (notes.length > 0) {
      // VexFlow duration mapping to ticks (1024 = quarter note)
      const durationMap: Record<string, number> = {
        'w': 4096,
        'h': 2048,
        'q': 1024,
        '8': 512,
        '16': 256,
        '32': 128
      };

      const TICKS_PER_MEASURE = 4096; // 4/4 time = 4 * 1024

      let currentMeasureNotes: StaveNote[] = [];
      let currentTicks = 0;
      let staveX = 10;
      const measureWidth = 200;

      notes.forEach((noteStr, index) => {
        const [key, duration] = noteStr.split('-');
        const vfNote = new StaveNote({
          keys: [key],
          duration: duration || 'q'
        });

        const ticks = durationMap[duration] || 1024;

        // If adding this note exceeds the current measure, render the measure and start a new one
        if (currentTicks + ticks > TICKS_PER_MEASURE && currentMeasureNotes.length > 0) {
          renderMeasure(currentMeasureNotes, staveX, staveX === 10);
          staveX += measureWidth;
          currentTicks = 0;
          currentMeasureNotes = [];
        }

        currentMeasureNotes.push(vfNote);
        currentTicks += ticks;
      });

      // Render the last measure
      if (currentMeasureNotes.length > 0) {
        renderMeasure(currentMeasureNotes, staveX, staveX === 10);
      }

      function renderMeasure(mNotes: StaveNote[], x: number, isFirst: boolean) {
        const stave = new Stave(x, 40, measureWidth);
        if (isFirst) {
          stave.addClef('treble').addTimeSignature('4/4');
        }
        stave.setContext(context).draw();

        const voice = new Voice({ numBeats: 4, beatValue: 4 });
        voice.setStrict(false); // Be less strict about exact beats to avoid crashes if rounding occurs
        voice.addTickables(mNotes);

        new Formatter().joinVoices([voice]).format([voice], measureWidth - (isFirst ? 50 : 20));
        voice.draw(context, stave);
      }
    }
  }, [notes, width, height]);

  return <div ref={containerRef} className="flex justify-center overflow-x-auto" />;
}
