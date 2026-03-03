import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter } from 'vexflow';

interface VexFlowRendererProps {
  notes: string[]; // e.g., ['c/4', 'd/4', 'e/4', 'f/4']
  width?: number;
  height?: number;
}

export function VexFlowRenderer({ notes, width = 500, height = 150 }: VexFlowRendererProps) {
  const containerRef = useRef<htmldivelement>(null);

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
      // Create the notes
      const vfNotes = notes.map(noteStr => {
        const [key, duration] = noteStr.split('-'); // e.g., 'c/4-q'
        return new StaveNote({
          keys: [key],
          duration: duration || 'q'
        });
      });

      // Create a voice in 4/4 and add the notes
      const voice = new Voice({ num_beats: 4, beat_value: 4 });
      voice.addTickables(vfNotes);

      // Format and justify the notes to 400 pixels
      new Formatter().joinVoices([voice]).format([voice], width - 50);

      // Render voice
      voice.draw(context, stave);
    }
  }, [notes, width, height]);

  return <div ref="{containerRef}" classname="flex justify-center overflow-x-auto"/>;
}
