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
  CreditCard,
  ChevronRight,
  Mic2,
  Sparkles,
} from "lucide-react";

// Mock VexFlowRenderer to avoid build issues if vexflow API changes, we'll implement a simple one
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

  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!url) return;
    setStep("downloading");
    setProgress(0);
    setError(null);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.data?.notes) {
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

    // Slow down progress bar since real AI processing takes a few minutes
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 0.5;
      });
    }, 1000);

    // Slow down step labels
    const steps: Step[] = [
      "downloading",
      "isolating",
      "extracting",
      "rendering",
    ];
    let currentIdx = steps.indexOf(step);
    
    const stepInterval = setInterval(() => {
      if (currentIdx < steps.length - 1) {
        currentIdx++;
        setStep(steps[currentIdx]);
      }
    }, 15000); // 15 seconds per step

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
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
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
            Bridging the gap between the music you love and the technical theory
            required to sing it. Instantly extract vocal melodies from any song
            and turn them into readable sheet music.
          </motion.p>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <LinkIcon className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube or Spotify link..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 outline-none"
                disabled={step !== "idle" && step !== "complete"}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors flex items-center gap-2"
                disabled={step !== "idle" && step !== "complete"}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
              <button
                onClick={handleProcess}
                disabled={!url || (step !== "idle" && step !== "complete")}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-indigo-600/20"
              >
                {step !== "idle" && step !== "complete" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Music className="w-5 h-5" />
                )}
                Transcribe
              </button>
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
          {step !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-3xl mx-auto mb-16 overflow-hidden"
            >
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                <div className="flex justify-between mb-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                  <div
                    className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />

                  {[
                    { id: "downloading", label: "Fetching Audio" },
                    { id: "isolating", label: "Isolating Vocals" },
                    { id: "extracting", label: "Extracting Pitch" },
                    { id: "rendering", label: "Rendering Score" },
                  ].map((s, i) => {
                    const steps = [
                      "downloading",
                      "isolating",
                      "extracting",
                      "rendering",
                      "complete",
                    ];
                    const currentIdx = steps.indexOf(step);
                    const isPast = currentIdx > i;
                    const isCurrent = currentIdx === i;

                    return (
                      <div
                        key={s.id}
                        className="relative z-10 flex flex-col items-center gap-3"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                            isPast
                              ? "bg-indigo-600 text-white"
                              : isCurrent
                                ? "bg-indigo-100 text-indigo-600 border-2 border-indigo-600"
                                : "bg-white border-2 border-slate-200 text-slate-400"
                          }`}
                        >
                          {isPast ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isCurrent ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <span className="text-sm font-medium">{i + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${isCurrent ? "text-indigo-600" : isPast ? "text-slate-900" : "text-slate-400"}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {step === "complete" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-8 border-t border-slate-100"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Vocal Transcription Complete
                        </h3>
                        <p className="text-sm text-slate-500">
                          Key: C Major • Tempo: 120 BPM
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Play className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 overflow-x-auto border border-slate-100">
                      <VexFlowRenderer
                        notes={notes.length > 0 ? notes : ["c/4-q", "e/4-q", "g/4-q", "c/5-q"]}
                        width={Math.max(600, notes.length * 40)}
                        height={150}
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How it works */}
        {step === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-5xl mx-auto mt-24"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                How it works
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Our advanced AI pipeline handles the heavy lifting, so you can
                focus on singing.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Mic2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  1. Source Separation
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We use state-of-the-art AI models (like Demucs) to isolate the
                  human voice from the heavy background music, giving us a clean
                  vocal stem.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  2. Pitch Extraction
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Our custom smoothing algorithms process the vocal track,
                  ignoring vibrato and breath noise, to extract discrete MIDI
                  notes accurately.
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <Music className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3. Score Rendering
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  The extracted MIDI data is beautifully rendered into standard
                  sheet music right in your browser, ready to print or export.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pricing Section */}
        <div id="pricing" className="max-w-5xl mx-auto mt-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Simple, credit-based pricing
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Processing AI audio models requires serious compute power. Our
              credit system ensures you only pay for what you use, protecting
              both your wallet and our servers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Freemium
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">£0</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  Perfect for trying out the service.
                </p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />1 free
                  transcription per month
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Standard processing speed
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Export to PDF
                </li>
              </ul>
              <button className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors">
                Current Plan
              </button>
            </div>

            {/* Credit Pack */}
            <div className="bg-indigo-600 rounded-3xl p-8 shadow-xl shadow-indigo-600/20 border border-indigo-500 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-indigo-100 mb-2">
                  Credit Pack
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">£5</span>
                  <span className="text-indigo-200">/pack</span>
                </div>
                <p className="text-sm text-indigo-200 mt-4">
                  For active vocal students and choir members.
                </p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                  10 song credits
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                  Credits never expire
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                  Priority GPU processing
                </li>
                <li className="flex items-center gap-3 text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-indigo-300" />
                  Export to MIDI & MusicXML
                </li>
              </ul>
              <button className="w-full py-3 px-4 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl font-bold transition-colors">
                Buy Credits
              </button>
            </div>

            {/* Studio Tier */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Studio Tier
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">£29</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-sm text-slate-500 mt-4">
                  For vocal coaches and music directors.
                </p>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  100 transcriptions per month
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Student sharing links
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Batch processing
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  Advanced vibrato smoothing controls
                </li>
              </ul>
              <button className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Mic2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">VocalScore</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              Contact
            </a>
          </div>
          <div className="text-sm text-slate-500">
            © {new Date().getFullYear()} VocalScore. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
