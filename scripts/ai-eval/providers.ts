// Free-tier text providers used by the evaluation. Keys come from environment variables only
// (never committed, never shipped to the browser). In production these calls live in the Cloudflare Worker.
export interface Usage { inTok: number; outTok: number }
export interface CallResult { text: string; ms: number; usage: Usage; status: number }
export interface Provider { name: string; model: string; call(system: string, user: string, maxTokens: number): Promise<CallResult> }

export function cloudflare(model = '@cf/qwen/qwen3-30b-a3b-fp8'): Provider {
  const acct = process.env.CF_ACCOUNT_ID, token = process.env.CF_API_TOKEN;
  if (!acct || !token) throw new Error('Set CF_ACCOUNT_ID and CF_API_TOKEN (Workers AI read/edit token, Free plan).');
  return {
    name: 'cloudflare', model,
    async call(system, user, maxTokens) {
      const t0 = Date.now();
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${acct}/ai/run/${model}`, {
        method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: maxTokens, temperature: 0.95 }),
      });
      const j = (await res.json().catch(() => ({}))) as { result?: { response?: unknown; usage?: { prompt_tokens?: number; completion_tokens?: number }; choices?: { message?: { content?: string } }[] } };
      const r = j.result ?? {};
      const raw = typeof r.response === 'string' ? r.response : r.response ? JSON.stringify(r.response) : r.choices?.[0]?.message?.content ?? '';
      return { text: raw, ms: Date.now() - t0, status: res.status, usage: { inTok: r.usage?.prompt_tokens ?? 0, outTok: r.usage?.completion_tokens ?? 0 } };
    },
  };
}

export function gemini(model = 'gemini-2.5-flash-lite'): Provider {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Set GEMINI_API_KEY (Google AI Studio key, no billing account linked).');
  return {
    name: 'gemini', model,
    async call(system, user, maxTokens) {
      const t0 = Date.now();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 1.0, maxOutputTokens: maxTokens },
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { candidates?: { content?: { parts?: { text?: string }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } };
      const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      const u = j.usageMetadata ?? {};
      return { text, ms: Date.now() - t0, status: res.status, usage: { inTok: u.promptTokenCount ?? 0, outTok: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) } };
    },
  };
}

/** Offline stand-in that returns schema-valid JSON, used to test the harness itself (not a quality signal). */
export function mock(): Provider {
  let n = 0;
  return {
    name: 'mock', model: 'mock',
    async call(_s, user) {
      n++;
      const L = (en: string) => ({ en, ar: `نص تجريبي ${n}` });
      const kind = user.includes('"task":"outline"') ? 'outline' : user.includes('"task":"ending"') ? 'ending' : 'beat';
      const marine = user.includes('"mode":"marine"');
      const acts = (marine ? ['lab', 'reef', 'mudflat', 'openSea', 'twilight', 'midnight', 'vents', 'trench'] : ['lab', 'forest', 'cave', 'desert', 'swamp', 'ruins', 'snow', 'ruins'])
        .map((b, i) => ({ id: `a${i}`, biome: b, props: i === 7 ? ['machine'] : [], purpose: `purpose ${i} ${n}`, npc: null, plants_clue: i === 2 ? 'c1' : null, pays_off: i === 6 ? 'c1' : null }));
      const out = (s: string) => ({ text: L(`${s} ${n}`), effects: [{ t: 'evidence', id: `e${n}` }], duck_mood: 'thinking', creature_state: 'curious' });
      const body = kind === 'outline'
        ? { title: L(`Mock ${n}`), premise: L(`premise ${n}`), premise_tag: `p${n % 7}`, tone: 'mysterious', twist_tag: `t${n % 5}`, acts, mysteries: ['m'], ending_options: ['x'] }
        : kind === 'ending' ? { title: L('End'), summary: L('Summary'), epilogue: L('Epilogue'), tone: 'heroic' }
          : { act_id: 'a0', text: L(`beat ${n}`), duck_line: L('hmm'), fact_id: null, choices: ['bold', 'careful', 'clever', 'kind'].map((st, i) => ({ id: `c${i}`, label: L(`choice ${i} ${n}`), style: st, uses_capability: null, check: i < 2 ? { stat: 'agility', dc: 5 } : null, success: out('ok'), fail: i < 2 ? out('fail') : null })) };
      return { text: JSON.stringify(body), ms: 5, status: 200, usage: { inTok: 1500, outTok: 600 } };
    },
  };
}
