import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../src/App';
import { simulateRun } from '../src/engine/sim';
import { load, recordRun, save } from '../src/engine/storage';

class MemStore implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); } getItem(k: string) { return this.m.get(k) ?? null; } key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); } setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('localStorage persistence', () => {
  it('round-trips settings, the current run and history', () => {
    const st = new MemStore();
    const r = simulateRun(1, 'classic');
    let d = load(st);
    d = recordRun({ ...d, settings: { ...d.settings, lang: 'en', textSpeed: 80 } }, r.state, r.ending);
    save(d, st);
    const back = load(st);
    expect(back.settings.lang).toBe('en');
    expect(back.runs).toHaveLength(1);
    expect(back.runs[0].ending).toBe(r.ending.id);
    expect(back.endingsSeen).toEqual([r.ending.id]);
  });
  it('survives corrupted or hostile data without crashing', () => {
    const st = new MemStore();
    for (const junk of ['{', 'null', '[]', '{"settings":{"lang":"xx","textSpeed":"fast"},"runs":[1,null,{"x":1}],"current":{"creature":{"name":"x"}}}']) {
      st.setItem('bsc-biolab:v1', junk);
      const d = load(st);
      expect(d.settings.lang === 'ar' || d.settings.lang === 'en').toBe(true);
      expect(Array.isArray(d.runs)).toBe(true);
      expect(d.current).toBeNull();
    }
  });
  it('keeps a bounded history', () => {
    const st = new MemStore();
    let d = load(st);
    for (let i = 0; i < 60; i++) { const r = simulateRun(i, 'marine'); d = recordRun(d, r.state, r.ending); }
    expect(d.runs.length).toBe(40);
  });
});

describe('UI: language and direction', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => cleanup());
  it('starts in Arabic (RTL) and switches to English (LTR)', async () => {
    render(<App />);
    expect(document.documentElement.dir).toBe('rtl');
    expect(screen.getByText('ادخل المختبر')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('EN')); });
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
    expect(screen.getByText('Enter the Lab')).toBeTruthy();
  });
  it('shows the exact credit footer', () => {
    render(<App />);
    expect(screen.getAllByText('تصميم اللعبة: عبدالله شويع - نادي العلوم البيولوجية').length).toBeGreaterThan(0);
  });
  it('can walk from the title into a running story', async () => {
    render(<App />);
    await act(async () => { fireEvent.click(screen.getByText('EN')); });
    await act(async () => { fireEvent.click(screen.getByText('Enter the Lab')); });
    await act(async () => { fireEvent.click(screen.getByText('Next')); });
    await act(async () => { fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Abdullah' } }); });
    await act(async () => { fireEvent.click(screen.getByText('Next')); });
    expect(screen.getByText('Build your hybrid')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('Next')); });
    await act(async () => { fireEvent.click(screen.getByText('Next')); });
    expect(screen.getByText('Try out your creature')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('Climbing test')); });
    await act(async () => { fireEvent.click(screen.getByText('Run the test')); });
    expect(document.querySelector('.lab-result')).toBeTruthy();
    expect(screen.getByText('Fiction')).toBeTruthy();
    await act(async () => { fireEvent.click(screen.getByText('To the adventure')); });
    await act(async () => { fireEvent.click(screen.getByText('Generated journey')); });
    await act(async () => { fireEvent.click(screen.getByText('Marine Science Club Mode')); });
    expect(screen.getByText('Phase 1 · Surface Waters')).toBeTruthy();
    expect(document.querySelectorAll('.btn-choice').length).toBeGreaterThanOrEqual(2);
  });
  it('can start a branching Story Archive adventure from the mode screen', async () => {
    render(<App />);
    await act(async () => { fireEvent.click(screen.getByText('EN')); });
    await act(async () => { fireEvent.click(screen.getByText('Enter the Lab')); });
    for (let i = 0; i < 4; i++) await act(async () => { fireEvent.click(screen.getByText('Next')); });
    await act(async () => { fireEvent.click(screen.getByText('Skip the lab')); });
    await act(async () => { fireEvent.click(screen.getByText(/The Silent Ridge Station/)); });
    await act(async () => { fireEvent.click(screen.getByText('Classic BioLab')); });
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(screen.getByText('Scene 1')).toBeTruthy();
  });
});
