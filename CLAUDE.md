# CLAUDE.md — FishingLog.ai Onboarding Guide

> **You are an AI coding assistant helping set up FishingLog.ai.** Follow this guide step by step.

## What is FishingLog.ai?

An AI fishing companion. Players log catches, get species identification, weather forecasts, tide data, and fishing tips powered by AI. Runs on Cloudflare Workers.

## Step 1: Deploy

```bash
npm install -g wrangler
npx wrangler login
npx wrangler deploy
```

Open the URL. You should see the FishingLog landing page.

## Step 2: Add API Keys

```bash
npx wrangler secret put DEEPINFRA_API_KEY
# Get key: https://deepinfra.com ($2 free credit)

npx wrangler secret put SILICONFLOW_API_KEY
# Get key: https://cloud.siliconflow.cn
```

Verify: `curl YOUR_URL/api/models`

## Step 3: Customize

- **Species database**: Edit species data in `src/game/`
- **Fishing tips**: Modify system prompt in chat handler
- **Weather integration**: Add Open-Meteo API calls
- **Images**: Configure FLUX.1-schnell for catch photos (SiliconFlow key)

## Troubleshooting

| Problem | Solution |
|---|---|
| No AI response | No API keys. Run Step 2. |
| Deployment 404 | Check `wrangler.toml` has `main = "src/worker.ts"` |

## Costs

~$0.30/month. Cloudflare free tier covers hosting.

*Superinstance & Lucineer (DiGennaro et al.)*
