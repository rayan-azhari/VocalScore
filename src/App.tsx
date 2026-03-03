import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Music,
  Link as LinkIcon,
  Upload,
  CheckCircle2,
  Loader2,
  Play,
  Download,
  Mic2,
  Sparkles,
} from "lucide-react";

import { VexFlowRenderer } from "./components/VexFlowRenderer";

type Step =
  | "idle"
  | "downloading"
  | "isolating"
  | "extracting"
  | "rendering"
  | "complete";

export default function App() {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);

  const [notes, setNotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputFile, setInputFile] = useState("");
  const [scoreData, setScoreData] = useState<any>(null);

  const handleProcess = async () => {
    if (!url && !inputFile) return;
    setStep("downloading");
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, inputFile }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();

      if (result.status === 'success' && result.data) {
        setScoreData(result.data);
        setNotes(result.data.notes);
      }

      setStep("complete");
      setProgress(100);
    } catch (err) {
      console.error('Error processing URL:', err);
      setError('Failed to process audio. Please try again.');
      setStep("idle");
    }
  };

  useEffect(() => {
    if (step === "idle" || step === "complete") return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 0.5;
      });
    }, 1000);

    const steps: Step[] = [
      "downloading",
      "isolating",
      "extracting",
      "rendering",
    ];
    let currentIdx = steps.indexOf(step as Step);

    const stepInterval = setInterval(() => {
      if (currentIdx < steps.length - 1) {
        currentIdx++;
        setStep(steps[currentIdx]);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, [step]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Mic2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">VocalScore</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>3 Credits</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl lg:text-7xl font-serif font-bold tracking-tight text-slate-900 mb-6 leading-tight"
          >
            Paste a link. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">
              Get vocal sheet music.
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 mb-10"
          >
            Instantly extract vocal melodies and lyrics from any song and turn them into readable sheet music.
          </motion.p>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 flex items-center bg-slate-50 rounded-2xl border border-slate-100 px-4">
                <LinkIcon className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube link..."
                  className="w-full px-4 py-4 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 outline-none"
                  disabled={step !== "idle" && step !== "complete"}
                />
              </div>
              <button
                onClick={() => handleProcess()}
                disabled={(!url && !inputFile) || step !== "idle"}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold transition-all ${(!url && !inputFile) || step !== "idle"
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30"
                  }`}
              >
                {step !== "idle" && step !== "complete" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Transcribe
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-slate-400 hover:text-indigo-600 text-xs font-medium uppercase tracking-wider transition-colors"
              >
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden w-full mt-4"
                  >
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                        Manual Vocal File Path
                      </label>
                      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
                        <Upload className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={inputFile}
                          onChange={(e) => setInputFile(e.target.value)}
                          placeholder="C:\Users\...\vocals.wav"
                          className="flex-1 bg-transparent border-none outline-none text-slate-900 text-sm"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 text-left">
                        Provide a direct path to a vocal stem to bypass YouTube download and separation.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Processing State */}
        <AnimatePresence mode="wait">
          {step !== "idle" && step !== "complete" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-3xl mx-auto mb-16"
            >
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between mb-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                  <div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />

                  {[
                    { id: "downloading", label: "Fetching" },
                    { id: "isolating", label: "Isolating" },
                    { id: "extracting", label: "Extracting" },
                    { id: "rendering", label: "Rendering" },
                  ].map((s, i) => {
                    const steps = ["downloading", "isolating", "extracting", "rendering", "complete"];
                    const currentIdx = steps.indexOf(step);
                    const isPast = currentIdx > i;
                    const isCurrent = currentIdx === i;

                    return (
                      <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${isPast ? "bg-indigo-600 text-white" : isCurrent ? "bg-indigo-100 text-indigo-600 border-2 border-indigo-600" : "bg-white border-2 border-slate-200 text-slate-400"
                            }`}
                        >
                          {isPast ? <CheckCircle2 className="w-5 h-5" /> : isCurrent ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-sm font-medium">{i + 1}</span>}
                        </div>
                        <span className={`text-xs font-medium ${isCurrent ? "text-indigo-600" : isPast ? "text-slate-900" : "text-slate-400"}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Area */}
        {step === "complete" && scoreData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-indigo-100/50"
          >
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 pb-8 border-b border-slate-100 gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-serif font-bold text-slate-900 mb-2 uppercase tracking-tight">
                  {scoreData.title || "Vocal Score"}
                </h2>
                <p className="text-slate-500 font-medium italic">
                  {scoreData.subtitle || "Extracted from Audio"}
                </p>
              </div>
              <div className="text-center md:text-right">
                <p className="text-indigo-600 font-bold uppercase tracking-[0.2em] text-xs mb-3">
                  {scoreData.composer || "VocalScore AI"}
                </p>
                <div className="flex gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  <span>Key: <span className="text-slate-900">{scoreData.key}</span></span>
                  <span>Tempo: <span className="text-slate-900">{scoreData.tempo} BPM</span></span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl overflow-x-auto min-h-[600px] py-8">
              <VexFlowRenderer notes={notes} width={1000} height={800} />
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap justify-center gap-4">
              <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200">
                <Download className="w-5 h-5" />
                Export PDF
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
                <Play className="w-5 h-5" />
                Play MIDI Preview
              </button>
            </div>
          </motion.div>
        )}

        {/* How it works */}
        {step === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-32"
          >
            <div className="grid md:grid-cols-3 gap-12">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Mic2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Source Separation</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Advanced AI models isolate the human voice from the background music, creating a clean vocal stem.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Lyrics & Pitch</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Whisper and Basic-Pitch work together to transcribe both wording and melody simultaneously.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Score Rendering</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Data is rendered into professional sheet music right in your browser, aligned and ready to sing.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-12 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Mic2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">VocalScore</span>
          </div>
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} VocalScore. AI-Powered Music Theory.
          </p>
        </div>
      </footer>
    </div>
  );
}
