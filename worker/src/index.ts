// Optional Cloudflare Worker that re-words engine-approved narration with Workers AI.
// No API keys live in the game: the Workers AI binding is configured in wrangler.toml.
// The game validates every response again on the client and falls back to static text on any problem.

export interface Env {
  AI: { run: (model: string, input: unknown) => Promise<{ response?: string } | unknown> };
  ALLOWED_ORIGIN: string; // e.g. https://q8hitman.github.io
  MODEL?: string;
}

interface Body { lang: 'ar' | 'en'; name: string; parts: Record<string, string>; place: string; base: string; success: boolean; recent: string[] }

const hits = new Map<string, { n: number; t: number }>();
const LIMIT = 20; // requests per IP per minute (best-effort, per isolate). Add a Cloudflare rate-limiting rule for hard limits.

function cors(origin: string, env: Env) {
  const allow = origin === env.ALLOWED_ORIGIN || origin.startsWith('http://localhost') ? origin : env.ALLOWED_ORIGIN;
  return { 'access-control-allow-origin': allow, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' };
}

function valid(b: unknown): b is Body {
  const x = b as Body;
  return !!x && (x.lang === 'ar' || x.lang === 'en') && typeof x.name === 'string' && x.name.length <= 24 && typeof x.base === 'string' && x.base.length <= 600
    && typeof x.place === 'string' && typeof x.success === 'boolean' && Array.isArray(x.recent) && typeof x.parts === 'object';
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('origin') ?? '';
    const h = cors(origin, env);
    if (req.method === 'OPTIONS') return new Response(null, { headers: h });
    if (req.method !== 'POST') return new Response('POST only', { status: 405, headers: h });
    if (origin && origin !== env.ALLOWED_ORIGIN && !origin.startsWith('http://localhost')) return new Response('forbidden', { status: 403, headers: h });

    const ip = req.headers.get('cf-connecting-ip') ?? 'anon'; const now = Date.now();
    const e = hits.get(ip); if (!e || now - e.t > 60_000) hits.set(ip, { n: 1, t: now }); else if (++e.n > LIMIT) return new Response('rate limited', { status: 429, headers: h });

    let body: unknown; try { body = await req.json(); } catch { return new Response('bad json', { status: 400, headers: h }); }
    if (!valid(body)) return new Response('bad request', { status: 400, headers: h });

    const langLine = body.lang === 'ar' ? 'Write in Arabic (Kuwaiti dialect is welcome for humour, otherwise Modern Standard Arabic). No other dialects.' : 'Write in English.';
    const system = `You re-word one short scene of a family-friendly biology adventure game. ${langLine}
Rules: keep the SAME outcome (${body.success ? 'it succeeded' : 'it went wrong'}); keep the creature name "${body.name}" exactly; only mention body parts it has: ${Object.values(body.parts).join(', ')};
no new characters, no violence or gore, max 2 sentences, under 380 characters. Reply ONLY with JSON: {"narration": "..."}.`;
    const user = `Place: ${body.place}\nOriginal: ${body.base}\nAvoid repeating: ${body.recent.join(' | ').slice(0, 600)}`;
    try {
      const out = await env.AI.run(env.MODEL ?? '@cf/meta/llama-3.1-8b-instruct', { messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 220 }) as { response?: string };
      const text = (out.response ?? '').trim();
      const m = text.match(/\{[\s\S]*\}/);
      const parsed = m ? JSON.parse(m[0]) : null;
      if (!parsed || typeof parsed.narration !== 'string') return new Response('model output invalid', { status: 502, headers: h });
      return new Response(JSON.stringify({ narration: parsed.narration }), { headers: { ...h, 'content-type': 'application/json' } });
    } catch {
      return new Response('upstream error', { status: 502, headers: h });
    }
  },
};
