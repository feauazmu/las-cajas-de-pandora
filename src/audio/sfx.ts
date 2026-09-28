// Synthesized sound effects (Web Audio, no files), plus a short vibration for
// the two big events (Inversionista, Expansion). Both obey the SFX toggle.

import { audioContext, onAudioReady } from "./context";

const VOLUME = 0.5;

let master: GainNode | null = null;
let muted = false;

onAudioReady((ctx) => {
  master = ctx.createGain();
  master.gain.value = muted ? 0 : VOLUME;
  master.connect(ctx.destination);
});

export function setSfxMuted(value: boolean): void {
  muted = value;
  if (master) master.gain.value = muted ? 0 : VOLUME;
}

interface Tone {
  freq: number;
  /** Frequency at the end of the note, for glides. */
  toFreq?: number;
  start?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
}

function play(tones: readonly Tone[]): void {
  const ctx = audioContext();
  if (!ctx || !master || muted) return;
  const t0 = ctx.currentTime;
  for (const tone of tones) {
    const start = t0 + (tone.start ?? 0);
    const end = start + tone.duration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = tone.type ?? "sine";
    osc.frequency.setValueAtTime(tone.freq, start);
    if (tone.toFreq) osc.frequency.exponentialRampToValueAtTime(tone.toFreq, end);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(tone.volume ?? 0.3, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(end + 0.02);
  }
}

/** Feature-detected: iOS Safari has no `navigator.vibrate`. */
function vibrate(pattern: number | number[]): void {
  if (muted || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}

const jitter = () => 0.9 + Math.random() * 0.2;

export const sfx = {
  click() {
    const f = 420 * jitter();
    play([{ freq: f, toFreq: f * 0.55, duration: 0.08, volume: 0.25 }]);
  },
  buy() {
    play([
      { freq: 1318.5, duration: 0.09, type: "triangle", volume: 0.2 },
      { freq: 1760, start: 0.08, duration: 0.18, type: "triangle", volume: 0.2 },
    ]);
  },
  denied() {
    play([{ freq: 140, toFreq: 110, duration: 0.12, type: "square", volume: 0.06 }]);
  },
  bark() {
    play([
      { freq: 900, toFreq: 380, duration: 0.07, type: "sawtooth", volume: 0.08 },
      { freq: 800, toFreq: 350, start: 0.09, duration: 0.06, type: "sawtooth", volume: 0.06 },
    ]);
  },
  inversionistaAppears() {
    play(
      [0, 1, 2, 3, 4, 5].map((i) => ({
        freq: 1200 + i * 180,
        start: i * 0.05,
        duration: 0.25,
        volume: 0.05,
      })),
    );
  },
  lump() {
    vibrate(40);
    play(
      Array.from({ length: 9 }, (_, i) => ({
        freq: 1500 + Math.random() * 1200,
        start: i * 0.045,
        duration: 0.12,
        type: "triangle" as const,
        volume: 0.12,
      })),
    );
  },
  frenzy() {
    vibrate(40);
    play(
      [523.25, 659.25, 783.99, 1046.5, 1318.5].map((freq, i) => ({
        freq,
        start: i * 0.07,
        duration: 0.2,
        type: "square" as const,
        volume: 0.07,
      })),
    );
  },
  fanfare() {
    vibrate([60, 60, 120]);
    play([
      { freq: 523.25, duration: 0.16, type: "sawtooth", volume: 0.12 },
      { freq: 659.25, start: 0.16, duration: 0.16, type: "sawtooth", volume: 0.12 },
      { freq: 783.99, start: 0.32, duration: 0.16, type: "sawtooth", volume: 0.12 },
      { freq: 1046.5, start: 0.48, duration: 0.6, type: "sawtooth", volume: 0.14 },
    ]);
  },
};
