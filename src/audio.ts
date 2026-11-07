// Optional ambient sound, synthesised with WebAudio (no audio files, works offline). Off by default.
import type { BiomeId } from './engine/types';

const PROFILE: Partial<Record<BiomeId, { freq: number; type: OscillatorType; noise: number; lfo: number }>> = {
  lab: { freq: 110, type: 'sine', noise: 0.01, lfo: 0.2 }, forest: { freq: 196, type: 'triangle', noise: 0.03, lfo: 0.5 },
  desert: { freq: 147, type: 'sine', noise: 0.04, lfo: 0.1 }, mountain: { freq: 131, type: 'sine', noise: 0.05, lfo: 0.15 },
  cave: { freq: 73, type: 'sine', noise: 0.015, lfo: 0.08 }, snow: { freq: 220, type: 'sine', noise: 0.05, lfo: 0.12 },
  swamp: { freq: 98, type: 'triangle', noise: 0.03, lfo: 0.3 }, ruins: { freq: 82, type: 'sawtooth', noise: 0.01, lfo: 0.05 },
  reef: { freq: 174, type: 'sine', noise: 0.04, lfo: 0.25 }, mudflat: { freq: 165, type: 'sine', noise: 0.04, lfo: 0.2 },
  seagrass: { freq: 185, type: 'sine', noise: 0.035, lfo: 0.22 }, openSea: { freq: 123, type: 'sine', noise: 0.06, lfo: 0.1 },
  twilight: { freq: 87, type: 'sine', noise: 0.02, lfo: 0.07 }, midnight: { freq: 55, type: 'sine', noise: 0.015, lfo: 0.05 },
  vents: { freq: 65, type: 'triangle', noise: 0.04, lfo: 0.09 }, trench: { freq: 41, type: 'sine', noise: 0.01, lfo: 0.03 },
};

class Ambient {
  private ctx: AudioContext | null = null;
  private nodes: AudioNode[] = [];
  private master: GainNode | null = null;

  play(biome: BiomeId) {
    const prof = PROFILE[biome] ?? PROFILE.lab!;
    try {
      this.ctx ??= new AudioContext();
      this.stopNodes();
      const ctx = this.ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0; this.master.connect(ctx.destination);
      this.master.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
      const osc = ctx.createOscillator(); osc.type = prof.type; osc.frequency.value = prof.freq;
      const osc2 = ctx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = prof.freq * 1.5;
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      const lfo = ctx.createOscillator(); lfo.frequency.value = prof.lfo; const lg = ctx.createGain(); lg.gain.value = 0.4;
      lfo.connect(lg); lg.connect(this.master.gain);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * prof.noise * 10;
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 600;
      noise.connect(filt); filt.connect(this.master);
      osc.connect(this.master); osc2.connect(g2); g2.connect(this.master);
      [osc, osc2, lfo, noise].forEach((n) => n.start());
      this.nodes = [osc, osc2, lfo, noise];
    } catch { /* audio unsupported: silently skip */ }
  }

  blip(good: boolean) {
    if (!this.ctx) return;
    try {
      const ctx = this.ctx; const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(good ? 523 : 220, ctx.currentTime);
      o.frequency.linearRampToValueAtTime(good ? 784 : 160, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.08, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.32);
    } catch { /* ignore */ }
  }

  private stopNodes() {
    this.nodes.forEach((n) => { try { (n as OscillatorNode).stop(); } catch { /* already stopped */ } });
    this.nodes = []; this.master?.disconnect(); this.master = null;
  }
  stop() { this.stopNodes(); }
}

export const ambient = new Ambient();
