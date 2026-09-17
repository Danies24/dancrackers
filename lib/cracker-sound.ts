"use client";

/**
 * A "visil" (whistle) firecracker — a climbing, fluttering whistle that
 * ends in a tiny closing pop, synthesized with the Web Audio API rather
 * than a shipped audio file, so there's no asset to fetch, license, or
 * ship, and it still works offline. Fired once per cart milestone crossed
 * (minimum order, zero packaging, free delivery) — see
 * use-cart-milestone-celebration.ts. Silently does nothing if Web Audio
 * isn't available (older Safari, SSR).
 */

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!sharedContext) sharedContext = new AudioContextCtor();
  if (sharedContext.state === "suspended") {
    // Fired from a state update inside a click handler's call stack — still
    // counts as user-activated in every browser tested, but resume() is
    // cheap to call defensively either way.
    sharedContext.resume().catch(() => {});
  }
  return sharedContext;
}

function createNoiseBuffer(ctx: AudioContext, duration: number, shape: (t: number) => number): AudioBuffer {
  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * shape(i / bufferSize);
  }
  return buffer;
}

export function playVisilSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.5;

  // ── The whistle itself: pitch climbs while fluttering, the classic
  // "visil" wobble — built as a precomputed frequency curve rather than a
  // second modulator oscillator, since it only needs to run once. ──
  const steps = 100;
  const curve = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const climb = 950 + t * 950;
    const flutter = Math.sin(t * duration * 2 * Math.PI * 24) * 55;
    curve[i] = climb + flutter;
  }

  const whistleOsc = ctx.createOscillator();
  whistleOsc.type = "triangle";
  whistleOsc.frequency.setValueCurveAtTime(curve, now, duration);

  const whistleGain = ctx.createGain();
  whistleGain.gain.setValueAtTime(0.001, now);
  whistleGain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
  whistleGain.gain.setValueAtTime(0.3, now + duration - 0.14);
  whistleGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  whistleOsc.connect(whistleGain).connect(ctx.destination);
  whistleOsc.start(now);
  whistleOsc.stop(now + duration + 0.02);

  // A thin breathy layer under the whistle for texture, following the same climb.
  const hissNoise = ctx.createBufferSource();
  hissNoise.buffer = createNoiseBuffer(ctx, duration, () => 1);
  const hissFilter = ctx.createBiquadFilter();
  hissFilter.type = "bandpass";
  hissFilter.Q.value = 6;
  hissFilter.frequency.setValueCurveAtTime(curve, now, duration);
  const hissGain = ctx.createGain();
  hissGain.gain.setValueAtTime(0.001, now);
  hissGain.gain.exponentialRampToValueAtTime(0.05, now + 0.05);
  hissGain.gain.setValueAtTime(0.05, now + duration - 0.14);
  hissGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  hissNoise.connect(hissFilter).connect(hissGain).connect(ctx.destination);
  hissNoise.start(now);

  // ── A tiny closing "phut" pop, right as the whistle fizzles out. ──
  const popAt = now + duration - 0.03;
  const popNoise = ctx.createBufferSource();
  popNoise.buffer = createNoiseBuffer(ctx, 0.08, (t) => (1 - t) ** 2);
  const popFilter = ctx.createBiquadFilter();
  popFilter.type = "highpass";
  popFilter.frequency.value = 900;
  const popGain = ctx.createGain();
  popGain.gain.setValueAtTime(0.22, popAt);
  popGain.gain.exponentialRampToValueAtTime(0.001, popAt + 0.08);
  popNoise.connect(popFilter).connect(popGain).connect(ctx.destination);
  popNoise.start(popAt);
}
