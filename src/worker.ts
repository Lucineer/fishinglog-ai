import { addNode, addEdge, traverse, crossDomainQuery, findPath, domainStats, getDomainNodes } from './lib/knowledge-graph.js';
import { loadSeedIntoKG, FLEET_REPOS, loadAllSeeds } from './lib/seed-loader.js';
import { loadBYOKConfig, callLLM, generateSetupHTML } from './lib/byok.js';
import { evapPipeline } from './lib/evaporation-pipeline.js';

import { getTracker } from './lib/confidence-tracker.js';
import { getRouter } from './lib/model-router.js';

const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*; frame-ancestors 'none';";

const SYS = 'You are FishingLog, an AI fishing companion. You help track catches, plan trips, and learn fishing techniques. You know Alaska fishing well. Be outdoorsy and patient.';
const HTML = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FishingLog.ai</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui;background:#0f172a;color:#e2e8f0;min-height:100vh}.h{background:linear-gradient(135deg,#0d9488,#064e3b);padding:2rem;text-align:center}.h h1{color:#f0fdfa}.h p{color:#99f6e4;margin:.5rem 0}.c{max-width:800px;margin:0 auto;padding:1rem}.chat{display:flex;flex-direction:column;height:60vh;border:1px solid #1e293b;border-radius:12px;overflow:hidden}.msgs{flex:1;overflow-y:auto;padding:1rem}.m{margin-bottom:1rem;padding:.75rem 1rem;border-radius:8px;max-width:80%}.m.u{background:#134e4a;margin-left:auto;color:#5eead4}.m.a{background:#1e293b}.ia{display:flex;padding:1rem;gap:.5rem;border-top:1px solid #1e293b}textarea{flex:1;background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:.75rem;resize:none}button{background:#0d9488;color:#f0fdfa;border:none;border-radius:8px;padding:.75rem 1.5rem;cursor:pointer;font-weight:600}button:hover{background:#0f766e}.sl{text-align:center;margin:1rem}.sl a{color:#5eead4}</style></head><body><div class="h"><h1>FishingLog.ai</h1><p>Your AI fishing companion</p></div><div class="c"><div class="chat"><div class="msgs" id="ms"></div><div class="ia"><textarea id="i" rows="2" placeholder="Ask about fishing..."></textarea><button onclick="s()">Send</button></div></div><div class="sl"><a href="/setup">Configure API Key</a></div></div><script>const ms=document.getElementById("ms"),i=document.getElementById("i");function a(r,t){const d=document.createElement("div");d.className="m "+r;d.textContent=t;ms.appendChild(d);ms.scrollTop=ms.scrollHeight}async function s(){const t=i.value.trim();if(!t)return;i.value="";a("u",t);try{const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:t}]})});const rd=r.body.getReader(),dc=new TextDecoder();let ai="";while(true){const{done,value}=await rd.read();if(done)break;ai+=dc.decode(value);ms.lastChild.remove();a("a",ai)}}catch(e){a("a","Error: "+e.message)}}i.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();s()}});a("a","Hi! I am FishingLog. Ask me about fishing trips, techniques, or species!");</script><div style="text-align:center;padding:24px;color:#475569;font-size:.75rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">⚓ The Fleet</a> · <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div></body></html>';

const tracker = getTracker();
const router = getRouter();

export default {
  async fetch(req, env) {
    const u = new URL(req.url);

    if (u.pathname === '/' || u.pathname === '')
      return new Response(HTML, { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': CSP;charset=utf-8' } });
    if (u.pathname === '/api/efficiency') return new Response(JSON.stringify({ totalCached: 0, totalHits: 0, cacheHitRate: 0, tokensSaved: 0, repo: 'fishinglog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json' } });
    if (u.pathname === '/health')
      return new Response(JSON.stringify({ status: 'ok', agent: 'FishingLog' }), { headers: { 'Content-Type': 'application/json' } });
    if (u.pathname === '/vessel.json') { try { const vj = await import('./vessel.json', { with: { type: 'json' } }); return new Response(JSON.stringify(vj.default || vj), { headers: { 'Content-Type': 'application/json' } }); } catch { return new Response('{}', { headers: { 'Content-Type': 'application/json' } }); } }
    if (u.pathname === '/setup')
      return new Response(generateSetupHTML('FishingLog', '#0d9488'), { headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': CSP;charset=utf-8' } });
    if (u.pathname === '/api/byok' && req.method === 'GET') {
      const c = await loadBYOKConfig(req, env.MEMORY);
      return new Response(JSON.stringify(c), { headers: { 'Content-Type': 'application/json' } });
    }
    if (u.pathname === '/api/byok' && req.method === 'POST') {
      const b = await req.json();
      await env.MEMORY.put('byok-config', JSON.stringify(b));
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ── Phase 1B: Confidence tracking endpoint ──
    if (u.pathname === '/api/evaporation') return new Response(JSON.stringify({ hot: [], warm: [], coverage: 0, repo: 'fishinglog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (u.pathname === '/api/kg') return new Response(JSON.stringify({ nodes: [], edges: [], domain: 'fishinglog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (u.pathname === '/api/memory') return new Response(JSON.stringify({ patterns: [], repo: 'fishinglog-ai', timestamp: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (u.pathname === '/api/seed') return new Response(JSON.stringify({ seed: 'fishinglog-ai', modules: ['fish-ai'], version: '1.0.0' }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    if (u.pathname === '/api/confidence') {
      if (req.method === 'GET') {
        return new Response(JSON.stringify(tracker.getAll()), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      if (req.method === 'POST') {
        const { topic, success } = await req.json();
        tracker.record(topic, typeof success === 'boolean' ? success : true);
        await env.MEMORY.put('confidence-state', tracker.serialize());
        return new Response(JSON.stringify(tracker.get(topic)), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Chat with confidence-aware model routing ──
    if (u.pathname === '/api/chat' && req.method === 'POST') {
      const { messages } = await req.json();
      const config = await loadBYOKConfig(req, env.MEMORY);
      if (!config)
        return new Response(JSON.stringify({ error: 'No BYOK config. Visit /setup.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

      // Restore confidence state from KV
      const saved = await env.MEMORY.get('confidence-state');
      if (saved) tracker.deserialize(saved);

      // Classify the last user message and route
      const lastMsg = messages.filter((m: { role: string }) => m.role === 'user').pop()?.content ?? '';
      const topic = tracker.classify(lastMsg);
      const conf = tracker.get(topic);
      const decision = router.route(topic, conf.score, conf.count);

      // Build system prompt with routing context
      const sysWithTier = `${SYS}\n\n[Model routing: tier ${decision.tier} — ${decision.reason}]`;
      const all = [{ role: 'system', content: sysWithTier }, ...messages];

      // Override model if routing suggests a different one
      const chatConfig = decision.modelOverride ? { ...config, model: decision.modelOverride } : config;
      const stream = await callLLM(chatConfig, all, { stream: true });

      // Record interaction optimistically (success assumed for streaming)
      tracker.record(topic, true);
      await env.MEMORY.put('confidence-state', tracker.serialize());

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Model-Tier': String(decision.tier),
          'X-Confidence-Topic': topic,
          'X-Confidence-Score': String(conf.score),
        },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
