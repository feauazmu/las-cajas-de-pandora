// Per-Stage music loop. Uses decoded AudioBuffers (not <audio loop>) so the
// loop point is gapless, and crossfades between Stages.

import { onAudioReady } from "./context";

const VOLUME = 0.22;
const CROSSFADE_S = 1.5;

let ctx: AudioContext | null = null;
let bus: GainNode | null = null;
let muted = false;
let wantedUrl: string | null = null;
let current: { url: string; source: AudioBufferSourceNode; gain: GainNode } | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();

onAudioReady((audio) => {
  ctx = audio;
  bus = audio.createGain();
  bus.gain.value = muted ? 0 : 1;
  bus.connect(audio.destination);
  if (wantedUrl) void start(wantedUrl);
});

function load(url: string): Promise<AudioBuffer> {
  let buffer = buffers.get(url);
  if (!buffer) {
    buffer = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((data) => ctx!.decodeAudioData(data));
    buffers.set(url, buffer);
  }
  return buffer;
}

async function start(url: string): Promise<void> {
  if (!ctx || !bus || current?.url === url) return;
  let buffer: AudioBuffer;
  try {
    buffer = await load(url);
  } catch (error) {
    console.warn(`Could not load music ${url}`, error);
    return;
  }
  if (wantedUrl !== url) return;
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(VOLUME, now + CROSSFADE_S);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(gain).connect(bus);
  source.start();
  if (current) {
    const old = current;
    old.gain.gain.setValueAtTime(old.gain.gain.value, now);
    old.gain.gain.linearRampToValueAtTime(0, now + CROSSFADE_S);
    old.source.stop(now + CROSSFADE_S + 0.05);
  }
  current = { url, source, gain };
}

/** Plays (or crossfades to) this track; waits for the first gesture if needed. */
export function playMusic(url: string): void {
  wantedUrl = url;
  void start(url);
}

export function setMusicMuted(value: boolean): void {
  muted = value;
  if (bus && ctx) bus.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.1);
}
