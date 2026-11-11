// Music and sound effects, played live with WebAudio: no audio files, nothing to download, works offline.
//
// The music is COMPOSED, not random: each theme has written chords, a bass line and a melody, in the gentle
// harp-and-flute style of classic adventure games. Themes are 16–32 bars long with an A section, a B section and a
// quiet repeat (accompaniment only), so a loop takes one to two minutes before anything repeats exactly.
// Themes: menu (rolling harp arpeggios), land, cold places, caves and ruins, sea surface, deep sea, ending.
// Everything is wrapped in try/catch: on a device without WebAudio the game is simply silent.
import type { BiomeId } from './engine/types';

type ThemeId = 'menu' | 'land' | 'cold' | 'dark' | 'sea' | 'deep' | 'ending';
/** One bar: pad chord (MIDI notes), bass note, and melody notes as [midi, start beat, length in beats]. */
interface Bar { chord: number[]; bass: number; mel: [number, number, number][] }
interface Theme {
  bpm: number; A: Bar[]; B?: Bar[]; form: ('A' | 'B' | 'a' | 'b')[]; // lower case = same chords, no melody
  arp: 'prelude' | 'broken' | 'sparse'; lead: 'flute' | 'celesta'; transpose?: number; padCut: number; padVol: number; arpVol: number; leadVol: number;
}
const bar = (chord: number[], bass: number, mel: [number, number, number][] = []): Bar => ({ chord, bass, mel });

// ── the written music (MIDI note numbers: 60 = middle C) ──
const MENU_A: Bar[] = [bar([48, 52, 55], 36), bar([45, 48, 52], 33), bar([41, 45, 48], 29), bar([43, 47, 50], 31), bar([48, 52, 55], 36), bar([45, 48, 52], 33), bar([50, 53, 57], 38), bar([43, 47, 50], 31)];
const MENU_B: Bar[] = [bar([41, 45, 48], 29), bar([43, 47, 50], 31), bar([52, 55, 59], 40), bar([45, 48, 52], 33), bar([41, 45, 48], 29), bar([43, 47, 50], 31), bar([48, 52, 55], 36), bar([48, 52, 55], 36)];
const LAND_A: Bar[] = [
  bar([53, 57, 60], 41, [[69, 0, 1], [72, 1, 1], [77, 2, 2]]), bar([52, 55, 60], 40, [[76, 0, 1.5], [74, 1.5, 0.5], [72, 2, 2]]),
  bar([50, 53, 57], 38, [[74, 0, 1], [77, 1, 1], [81, 2, 2]]), bar([46, 50, 53], 34, [[79, 0, 1], [77, 1, 1], [74, 2, 2]]),
  bar([45, 48, 53], 33, [[72, 0, 1], [77, 1, 1], [81, 2, 1], [79, 3, 1]]), bar([43, 46, 50], 31, [[82, 0, 1.5], [81, 1.5, 0.5], [79, 2, 2]]),
  bar([48, 52, 55], 36, [[76, 0, 1], [79, 1, 1], [84, 2, 2]]), bar([48, 52, 58], 36, [[82, 0, 1], [79, 1, 1], [76, 2, 1], [72, 3, 1]]),
];
const LAND_B: Bar[] = [
  bar([46, 50, 53], 34, [[74, 0, 2], [77, 2, 2]]), bar([48, 52, 55], 36, [[76, 0, 2], [79, 2, 2]]),
  bar([45, 48, 52], 33, [[72, 0, 1], [76, 1, 1], [81, 2, 2]]), bar([50, 53, 57], 38, [[77, 0, 3], [76, 3, 1]]),
  bar([46, 50, 53], 34, [[74, 0, 1], [77, 1, 1], [82, 2, 2]]), bar([48, 52, 55], 36, [[84, 0, 1.5], [82, 1.5, 0.5], [79, 2, 2]]),
  bar([53, 57, 60], 41, [[81, 0, 2], [77, 2, 2]]), bar([53, 57, 60], 41, [[77, 0, 4]]),
];
const SEA_A: Bar[] = [
  bar([50, 54, 57], 38, [[78, 0, 1.5], [76, 1.5, 0.5], [74, 2, 2]]), bar([49, 52, 57], 37, [[76, 0, 1.5], [74, 1.5, 0.5], [73, 2, 2]]),
  bar([47, 50, 54], 35, [[74, 0, 1], [78, 1, 1], [83, 2, 2]]), bar([43, 47, 50], 31, [[81, 0, 1], [79, 1, 1], [74, 2, 2]]),
  bar([42, 45, 50], 30, [[81, 0, 2], [78, 2, 2]]), bar([43, 47, 50], 31, [[83, 0, 1.5], [81, 1.5, 0.5], [79, 2, 2]]),
  bar([45, 49, 52], 33, [[76, 0, 1], [81, 1, 1], [85, 2, 2]]), bar([45, 49, 52], 33, [[81, 0, 2], [76, 2, 2]]),
];
const SEA_B: Bar[] = [
  bar([43, 47, 50], 31, [[74, 0, 2], [79, 2, 2]]), bar([45, 49, 52], 33, [[76, 0, 2], [81, 2, 2]]),
  bar([42, 45, 50], 30, [[78, 0, 1], [81, 1, 1], [86, 2, 2]]), bar([47, 50, 54], 35, [[83, 0, 3], [81, 3, 1]]),
  bar([43, 47, 50], 31, [[79, 0, 1], [83, 1, 1], [86, 2, 2]]), bar([45, 49, 52], 33, [[85, 0, 1.5], [83, 1.5, 0.5], [81, 2, 2]]),
  bar([50, 54, 57], 38, [[78, 0, 2], [74, 2, 2]]), bar([50, 54, 57], 38, [[74, 0, 4]]),
];
const DEEP_A: Bar[] = [
  bar([45, 48, 52], 33, [[76, 0, 2], [72, 2, 2]]), bar([41, 45, 48], 29, [[69, 0, 3]]), bar([50, 53, 57], 38, [[77, 0, 2], [74, 2, 2]]), bar([40, 44, 47], 28, [[71, 0, 4]]),
  bar([45, 48, 52], 33, [[81, 0, 1], [76, 1, 3]]), bar([41, 45, 48], 29, [[72, 0, 2], [69, 2, 2]]), bar([50, 53, 57], 38, [[74, 0, 3], [77, 3, 1]]), bar([40, 44, 47], 28, [[76, 0, 4]]),
];
const END_A: Bar[] = [
  bar([53, 57, 60], 41, [[81, 0, 1], [79, 1, 1], [77, 2, 2]]), bar([55, 59, 62], 43, [[83, 0, 1], [81, 1, 1], [79, 2, 2]]),
  bar([52, 55, 59], 40, [[79, 0, 1.5], [76, 1.5, 0.5], [71, 2, 2]]), bar([45, 48, 52], 33, [[72, 0, 1], [76, 1, 1], [81, 2, 2]]),
  bar([53, 57, 60], 41, [[81, 0, 1], [84, 1, 1], [81, 2, 1], [77, 3, 1]]), bar([55, 59, 62], 43, [[79, 0, 1], [83, 1, 1], [86, 2, 2]]),
  bar([48, 52, 55], 36, [[88, 0, 2], [84, 2, 2]]), bar([48, 52, 55], 36, [[84, 0, 4]]),
];
const THEMES: Record<ThemeId, Theme> = {
  menu: { bpm: 72, A: MENU_A, B: MENU_B, form: ['A', 'A', 'B', 'A'], arp: 'prelude', lead: 'celesta', padCut: 1100, padVol: 0.035, arpVol: 0.075, leadVol: 0 },
  land: { bpm: 92, A: LAND_A, B: LAND_B, form: ['A', 'B', 'a', 'A', 'B', 'b'], arp: 'broken', lead: 'flute', padCut: 1300, padVol: 0.04, arpVol: 0.05, leadVol: 0.085 },
  cold: { bpm: 76, A: SEA_A, B: SEA_B, form: ['A', 'b', 'B', 'a'], arp: 'broken', lead: 'celesta', transpose: -2, padCut: 1600, padVol: 0.035, arpVol: 0.04, leadVol: 0.075 },
  dark: { bpm: 66, A: DEEP_A, form: ['A', 'a'], arp: 'broken', lead: 'celesta', transpose: 3, padCut: 700, padVol: 0.05, arpVol: 0.03, leadVol: 0.06 },
  sea: { bpm: 84, A: SEA_A, B: SEA_B, form: ['A', 'B', 'a', 'A', 'B', 'b'], arp: 'broken', lead: 'flute', padCut: 1500, padVol: 0.04, arpVol: 0.05, leadVol: 0.08 },
  deep: { bpm: 58, A: DEEP_A, form: ['A', 'a'], arp: 'sparse', lead: 'celesta', padCut: 520, padVol: 0.06, arpVol: 0.03, leadVol: 0.07 },
  ending: { bpm: 80, A: END_A, B: MENU_B, form: ['A', 'b', 'A'], arp: 'prelude', lead: 'flute', padCut: 1400, padVol: 0.04, arpVol: 0.045, leadVol: 0.09 },
};
const BIOME_THEME: Partial<Record<BiomeId, ThemeId>> = {
  lab: 'menu', forest: 'land', desert: 'land', swamp: 'land', mountain: 'cold', snow: 'cold', cave: 'dark', ruins: 'dark',
  reef: 'sea', mudflat: 'sea', seagrass: 'sea', openSea: 'sea', twilight: 'deep', midnight: 'deep', vents: 'deep', trench: 'deep',
};
const VOLUME = 0.6;
const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null; private padIn: BiquadFilterNode | null = null; private wetIn: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private id: ThemeId | null = null; private step = 0; private nextTime = 0;

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const g = globalThis as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
        const AC = g.AudioContext ?? g.webkitAudioContext;
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

  private start(id: ThemeId) {
    const ctx = this.ensure(); if (!ctx || !this.master) return;
    if (this.id === id && this.timer) return;
    try {
      this.fadeBus(1.6);
      const th = THEMES[id];
      const bus = ctx.createGain(); bus.gain.setValueAtTime(0.0001, ctx.currentTime); bus.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 1.8);
      bus.connect(this.master);
      const padIn = ctx.createBiquadFilter(); padIn.type = 'lowpass'; padIn.frequency.value = th.padCut; padIn.Q.value = 0.3; padIn.connect(bus);
      // a soft hall: two echoes feeding each other, darkened so the tail is warm, never metallic
      const wetIn = ctx.createGain(); wetIn.gain.value = 1;
      const d1 = ctx.createDelay(1.5), d2 = ctx.createDelay(1.5); d1.delayTime.value = 0.29; d2.delayTime.value = 0.43;
      const f1 = ctx.createGain(), f2 = ctx.createGain(); f1.gain.value = 0.36; f2.gain.value = 0.3;
      const tone = ctx.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2400;
      const wet = ctx.createGain(); wet.gain.value = 0.34;
      wetIn.connect(d1); wetIn.connect(d2); d1.connect(f1); f1.connect(d2); d2.connect(f2); f2.connect(d1); d1.connect(tone); d2.connect(tone); tone.connect(wet); wet.connect(bus);
      this.bus = bus; this.padIn = padIn; this.wetIn = wetIn;
      this.id = id; this.step = 0; this.nextTime = ctx.currentTime + 0.15;
      if (!this.timer) this.timer = setInterval(() => this.tick(), 60);
    } catch { /* silent */ }
  }

  private tick() {
    const ctx = this.ctx; if (!ctx || !this.id || !this.bus) return;
    const th = THEMES[this.id]; const sixteenth = 60 / th.bpm / 4;
    // if the tab was in the background, do not replay minutes of missed notes at once
    if (this.nextTime < ctx.currentTime - 0.4) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.35) { this.schedule(th, this.step, this.nextTime, sixteenth); this.nextTime += sixteenth; this.step++; }
  }

  private voice(kind: 'harp' | 'flute' | 'celesta' | 'bass', midi: number, t: number, len: number, vol: number) {
    const ctx = this.ctx!; const bus = this.bus!; const wet = this.wetIn!;
    const g = ctx.createGain(); g.connect(bus); if (kind !== 'bass') g.connect(wet);
    const o = ctx.createOscillator(); o.frequency.value = hz(midi);
    let end = t + len;
    if (kind === 'harp') {
      o.type = 'triangle'; const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = hz(midi + 12); const g2 = ctx.createGain(); g2.gain.value = 0.35; o2.connect(g2); g2.connect(g);
      end = t + 1.1; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, end);
      o2.start(t); o2.stop(end + 0.05);
    } else if (kind === 'celesta') {
      o.type = 'sine'; const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = hz(midi + 24); const g2 = ctx.createGain(); g2.gain.value = 0.16; o2.connect(g2); g2.connect(g);
      end = t + Math.max(1.6, len + 0.8); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, end);
      o2.start(t); o2.stop(end + 0.05);
    } else if (kind === 'flute') {
      o.type = 'sine'; const o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = hz(midi); const g2 = ctx.createGain(); g2.gain.value = 0.3; o2.connect(g2); g2.connect(g);
      // a slow, light vibrato that starts after the note has spoken
      const lfo = ctx.createOscillator(); lfo.frequency.value = 5.2; const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(hz(midi) * 0.006, t + 0.35); lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      end = t + len + 0.18; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.07); g.gain.setValueAtTime(vol * 0.9, t + Math.max(0.08, len - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, end);
      o2.start(t); o2.stop(end + 0.05); lfo.start(t); lfo.stop(end + 0.05);
    } else {
      o.type = 'sine'; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, end);
    }
    o.connect(g); o.start(t); o.stop(end + 0.05);
  }

  private schedule(th: Theme, step: number, t: number, sixteenth: number) {
    const ctx = this.ctx!;
    try {
      const barLen = 16, barsPerSection = th.A.length;
      const barIndex = Math.floor(step / barLen), inBar = step % barLen;
      const sec = th.form[Math.floor(barIndex / barsPerSection) % th.form.length];
      const bars = (sec === 'B' || sec === 'b') && th.B ? th.B : th.A;
      const b = bars[barIndex % barsPerSection]; const withMelody = sec === 'A' || sec === 'B';
      const tr = th.transpose ?? 0; const beat = sixteenth * 4;
      if (inBar === 0) {
        // strings: the chord swells in and out over the bar
        for (const note of b.chord) for (const det of [-6, 7]) {
          const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = hz(note + tr + 12); o.detune.value = det;
          const g = ctx.createGain(); const len = beat * 4;
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(th.padVol, t + len * 0.4); g.gain.linearRampToValueAtTime(th.padVol * 0.75, t + len * 0.85); g.gain.linearRampToValueAtTime(0.0001, t + len * 1.3);
          o.connect(g); g.connect(this.padIn!); o.start(t); o.stop(t + len * 1.35);
        }
        this.voice('bass', b.bass + tr + 12, t, beat * 3.6, 0.1);
      }
      // accompaniment
      const tones = [b.chord[0], b.chord[1], b.chord[2], b.chord[0] + 12, b.chord[1] + 12, b.chord[2] + 12, b.chord[0] + 24, b.chord[1] + 24];
      if (th.arp === 'prelude') {
        // rolling harp: up through the chord over one bar, back down over the next
        const up = barIndex % 2 === 0; const seq = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 2, 3]; const i = up ? seq[inBar] : seq[(inBar + 8) % 16];
        this.voice('harp', tones[i] + tr, t, 0.9, th.arpVol * (inBar % 4 === 0 ? 1 : 0.72));   // C3–E5: warm, never shrill
      } else if (th.arp === 'broken') {
        if (inBar % 2 === 0) { const pat = [0, 2, 1, 2, 3, 2, 1, 2]; this.voice('harp', tones[pat[inBar / 2]] + tr + 12, t, 0.9, th.arpVol * (inBar % 8 === 0 ? 1 : 0.7)); }
      } else if (inBar % 8 === 4) {
        this.voice('celesta', tones[(barIndex * 3 + inBar / 4) % 6] + tr + 24, t, 1.5, th.arpVol);
      }
      // melody
      if (withMelody && th.leadVol > 0) for (const [note, at, len] of b.mel) if (Math.round(at * 4) === inBar) this.voice(th.lead, note + tr, t, len * beat, th.leadVol);
    } catch { /* silent */ }
  }

  private fadeBus(seconds: number) {
    const ctx = this.ctx; const bus = this.bus; if (!ctx || !bus) return;
    try {
      bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(Math.max(0.0001, bus.gain.value), ctx.currentTime); bus.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
      setTimeout(() => { try { bus.disconnect(); } catch { /* gone */ } }, seconds * 1000 + 2500);
    } catch { /* silent */ }
    this.bus = null; this.padIn = null; this.wetIn = null;
  }

  /** Music for a story place. */
  play(biome: BiomeId) { this.start(BIOME_THEME[biome] ?? 'land'); }
  /** Menu or ending music. */
  theme(id: 'menu' | 'ending') { this.start(id); }
  stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.fadeBus(0.6); this.id = null; }

  // ── sound effects (soft bell tones, so they sit inside the music) ──
  private notes(list: [number, number, number][], vol = 0.08) {
    const ctx = this.ensure(); if (!ctx || !this.master) return;
    try {
      for (const [midi, at, len] of list) {
        const t = ctx.currentTime + at;
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = hz(midi);
        const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = hz(midi + 12); const g2 = ctx.createGain(); g2.gain.value = 0.3;
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g); o2.connect(g2); g2.connect(g); g.connect(this.master); o.start(t); o2.start(t); o.stop(t + len + 0.05); o2.stop(t + len + 0.05);
      }
    } catch { /* silent */ }
  }
  /** Result of a choice: a rising chime for success, a soft falling pair for a setback. */
  blip(good: boolean) { this.notes(good ? [[72, 0, 0.5], [76, 0.09, 0.5], [79, 0.18, 0.5], [84, 0.27, 0.9]] : [[64, 0, 0.5], [60, 0.16, 0.5], [57, 0.32, 0.9]], good ? 0.075 : 0.085); }
  /** A soft tick for buttons and choices. */
  tap() { this.notes([[84, 0, 0.12]], 0.03); }
  /** Something was found or revealed. */
  reveal() { this.notes([[79, 0, 0.6], [84, 0.1, 0.6], [91, 0.2, 1.1]], 0.05); }
  /** The story is over. */
  fanfare() { this.notes([[67, 0, 0.6], [72, 0.15, 0.6], [76, 0.3, 0.6], [79, 0.45, 0.6], [84, 0.6, 1.6]], 0.08); }
}

export const ambient = new Music();
