// Music and sound effects, generated live with WebAudio: no audio files, nothing to download, works offline.
// A small sequencer plays soft chords, a bass note and a sparse melody in a scale; each kind of place has its own
// mood (menus, land, caves and ruins, sea surface, deep sea, ending) and the music cross-fades between them.
// Everything is wrapped in try/catch: on a device without WebAudio the game is simply silent.
import type { BiomeId } from './engine/types';

type MoodId = 'menu' | 'land' | 'dark' | 'cold' | 'sea' | 'deep' | 'ending';
interface Mood {
  bpm: number; root: number; scale: number[]; prog: number[]; pad: OscillatorType; padGain: number; cutoff: number;
  melody: number; melodyOct: number; decay: number; bass: number; noise: number; noiseCut: number;
}
const MINOR = [0, 2, 3, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11], DORIAN = [0, 2, 3, 5, 7, 9, 10], LYDIAN = [0, 2, 4, 6, 7, 9, 11];
const MOODS: Record<MoodId, Mood> = {
  menu: { bpm: 66, root: 146.83, scale: DORIAN, prog: [0, 3, 5, 4], pad: 'triangle', padGain: 0.05, cutoff: 1400, melody: 0.3, melodyOct: 2, decay: 1.6, bass: 0.07, noise: 0, noiseCut: 400 },
  land: { bpm: 84, root: 110, scale: MINOR, prog: [0, 5, 2, 6], pad: 'triangle', padGain: 0.045, cutoff: 1700, melody: 0.45, melodyOct: 2, decay: 1.1, bass: 0.08, noise: 0.006, noiseCut: 900 },
  dark: { bpm: 68, root: 98, scale: MINOR, prog: [0, 3, 0, 4], pad: 'sine', padGain: 0.06, cutoff: 800, melody: 0.2, melodyOct: 2, decay: 2.2, bass: 0.09, noise: 0.004, noiseCut: 300 },
  cold: { bpm: 72, root: 130.81, scale: DORIAN, prog: [0, 4, 3, 5], pad: 'sine', padGain: 0.05, cutoff: 2200, melody: 0.35, melodyOct: 3, decay: 2.0, bass: 0.06, noise: 0.01, noiseCut: 2400 },
  sea: { bpm: 76, root: 130.81, scale: LYDIAN, prog: [0, 4, 5, 3], pad: 'triangle', padGain: 0.045, cutoff: 1900, melody: 0.5, melodyOct: 2, decay: 1.3, bass: 0.07, noise: 0.012, noiseCut: 700 },
  deep: { bpm: 52, root: 65.41, scale: MINOR, prog: [0, 0, 5, 3], pad: 'sine', padGain: 0.075, cutoff: 520, melody: 0.16, melodyOct: 4, decay: 3.4, bass: 0.1, noise: 0.008, noiseCut: 180 },
  ending: { bpm: 72, root: 130.81, scale: MAJOR, prog: [0, 4, 5, 3], pad: 'triangle', padGain: 0.05, cutoff: 2000, melody: 0.5, melodyOct: 2, decay: 1.5, bass: 0.07, noise: 0, noiseCut: 400 },
};
const BIOME_MOOD: Partial<Record<BiomeId, MoodId>> = {
  lab: 'menu', forest: 'land', desert: 'land', swamp: 'land', mountain: 'cold', snow: 'cold', cave: 'dark', ruins: 'dark',
  reef: 'sea', mudflat: 'sea', seagrass: 'sea', openSea: 'sea', twilight: 'deep', midnight: 'deep', vents: 'deep', trench: 'deep',
};
const VOLUME = 0.55;

class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null; private filter: BiquadFilterNode | null = null; private echo: DelayNode | null = null;
  private noise: AudioBufferSourceNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private mood: MoodId | null = null; private step = 0; private nextTime = 0;

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        const comp = this.ctx.createDynamicsCompressor();
        this.master = this.ctx.createGain(); this.master.gain.value = VOLUME;
        this.master.connect(comp); comp.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch { return null; }
  }
  /** Browsers only allow sound after a tap or key press: call this from one. */
  resume() { this.ensure(); }

  private freq(m: Mood, degree: number, octave = 0): number {
    const len = m.scale.length; const d = ((degree % len) + len) % len; const o = Math.floor(degree / len) + octave;
    return m.root * 2 ** ((m.scale[d] + 12 * o) / 12);
  }

  /** Music for a kind of place; the same mood keeps playing, a new one cross-fades in. */
  mood_(id: MoodId) {
    const ctx = this.ensure(); if (!ctx || !this.master) return;
    if (this.mood === id && this.timer) return;
    try {
      this.fadeBus(1.4);
      const m = MOODS[id];
      const bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, ctx.currentTime); bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.6);
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = m.cutoff; filter.Q.value = 0.4;
      const echo = ctx.createDelay(1.2); echo.delayTime.value = (60 / m.bpm) * 0.75; const fb = ctx.createGain(); fb.gain.value = 0.32; const wet = ctx.createGain(); wet.gain.value = 0.5;
      echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(bus);
      filter.connect(bus); bus.connect(this.master);
      this.bus = bus; this.filter = filter; this.echo = echo;
      if (m.noise > 0) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
        const nf = ctx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = m.noiseCut;
        const ng = ctx.createGain(); ng.gain.value = m.noise * 6;
        // a slow swell, like waves or wind
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11; const lg = ctx.createGain(); lg.gain.value = m.noise * 4; lfo.connect(lg); lg.connect(ng.gain); lfo.start();
        src.connect(nf); nf.connect(ng); ng.connect(bus); src.start(); this.noise = src;
      }
      this.mood = id; this.step = 0; this.nextTime = ctx.currentTime + 0.12;
      if (!this.timer) this.timer = setInterval(() => this.tick(), 70);
    } catch { /* silent */ }
  }

  private tick() {
    const ctx = this.ctx; if (!ctx || !this.mood || !this.filter) return;
    const m = MOODS[this.mood]; const eighth = 60 / m.bpm / 2;
    // if the tab was in the background, do not try to catch up on minutes of missed notes
    if (this.nextTime < ctx.currentTime - 0.5) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.3) { this.schedule(m, this.step, this.nextTime, eighth); this.nextTime += eighth; this.step++; }
  }

  private schedule(m: Mood, step: number, t: number, eighth: number) {
    const ctx = this.ctx!; const bar = Math.floor(step / 8); const chord = m.prog[bar % m.prog.length];
    try {
      if (step % 8 === 0) {
        // the chord: three soft notes that swell in and fade over the bar
        const len = eighth * 8;
        [0, 2, 4].forEach((d, i) => {
          const f = this.freq(m, chord + d, 1);
          for (const det of [-5, 6]) {
            const o = ctx.createOscillator(); o.type = m.pad; o.frequency.value = f; o.detune.value = det + i;
            const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(m.padGain, t + len * 0.35); g.gain.linearRampToValueAtTime(m.padGain * 0.7, t + len * 0.8); g.gain.linearRampToValueAtTime(0.0001, t + len * 1.25);
            o.connect(g); g.connect(this.filter!); o.start(t); o.stop(t + len * 1.3);
          }
        });
        // the bass: the chord's root, once per bar
        const b = ctx.createOscillator(); b.type = 'sine'; b.frequency.value = this.freq(m, chord, 0);
        const bg = ctx.createGain(); bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(m.bass, t + 0.08); bg.gain.exponentialRampToValueAtTime(0.0001, t + len * 0.9);
        b.connect(bg); bg.connect(this.bus!); b.start(t); b.stop(t + len);
      }
      // the melody: a few plucked notes from the chord and the scale, with an echo
      const strong = step % 2 === 0;
      if (Math.random() < m.melody * (strong ? 1 : 0.45)) {
        const pool = [0, 2, 4, 7, 9, 1, 3];
        const deg = chord + pool[Math.floor(Math.random() * (strong ? 4 : pool.length))];
        const o = ctx.createOscillator(); o.type = this.mood === 'deep' ? 'sine' : 'triangle'; o.frequency.value = this.freq(m, deg, m.melodyOct);
        const g = ctx.createGain(); const v = 0.05 + Math.random() * 0.03;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + m.decay);
        o.connect(g); g.connect(this.filter!); if (this.echo) g.connect(this.echo); o.start(t); o.stop(t + m.decay + 0.05);
      }
    } catch { /* silent */ }
  }

  private fadeBus(seconds: number) {
    const ctx = this.ctx; const bus = this.bus; if (!ctx || !bus) return;
    try {
      bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime); bus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
      const noise = this.noise; this.noise = null;
      setTimeout(() => { try { noise?.stop(); bus.disconnect(); } catch { /* gone */ } }, seconds * 1000 + 600);
    } catch { /* silent */ }
    this.bus = null; this.filter = null; this.echo = null;
  }

  /** Music for a story place. */
  play(biome: BiomeId) { this.mood_(BIOME_MOOD[biome] ?? 'land'); }
  /** Menu or ending music. */
  theme(id: 'menu' | 'ending') { this.mood_(id); }
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.fadeBus(0.6); this.mood = null; }

  // ── sound effects ──
  private notes(list: [number, number, number][], type: OscillatorType = 'triangle', vol = 0.09) {
    const ctx = this.ensure(); if (!ctx || !this.master) return;
    try {
      for (const [f, at, len] of list) {
        const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
        const g = ctx.createGain(); const t = ctx.currentTime + at;
        g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g); g.connect(this.master); o.start(t); o.stop(t + len + 0.05);
      }
    } catch { /* silent */ }
  }
  /** Result of a choice: a rising chime for success, a low falling pair for a setback. */
  blip(good: boolean) { this.notes(good ? [[523.25, 0, 0.35], [659.25, 0.09, 0.35], [783.99, 0.18, 0.55]] : [[233.08, 0, 0.4], [174.61, 0.16, 0.6]], good ? 'triangle' : 'sine', good ? 0.09 : 0.11); }
  /** A soft tick for buttons and choices. */
  tap() { this.notes([[880, 0, 0.07]], 'sine', 0.035); }
  /** Something was found or revealed. */
  reveal() { this.notes([[987.77, 0, 0.5], [1318.5, 0.1, 0.5], [1975.5, 0.22, 0.9]], 'sine', 0.05); }
  /** The story is over. */
  fanfare() { this.notes([[392, 0, 0.5], [523.25, 0.14, 0.5], [659.25, 0.28, 0.5], [783.99, 0.42, 1.2]], 'triangle', 0.09); }
}

export const ambient = new Music();
