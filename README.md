# fishinglog-ai

<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h3 align="center">Edge AI Fishing Vessel</h3>

<p align="center">Species classification, captain voice interface, and conversational training.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#the-fleet">The Fleet</a> ·
  <a href="https://github.com/Lucineer/fishinglog-ai/issues">Issues</a>
</p>

---

**Live:** [fishinglog-ai](https://fishinglog-ai.casey-digennaro.workers.dev) · **Powered by [Capitaine](https://github.com/Lucineer/capitaine)**

---

You are out before sunrise. The radio is quiet. You have a fish on. You do not want to unlock your phone or sign into an app. You do not want a service logging your coordinates.

This is not another fishing log. It's an edge AI vessel you run yourself. It operates where you do. It learns what you teach it. And it does not work for anyone else.

### Why this exists
Most fishing apps follow the same model: you provide your data, they provide a log. They can mine it, advertise, and may shut down.

fishinglog-ai is built the other way. You fork it. You deploy it. You own every part. It runs on the edge, can operate offline on your hardware, and learns with you. This is a tool you control.

### What makes this different
Many AI agents are interfaces to a remote, controlled model. This is a Cocapn Fleet vessel:
- The repository *is* the agent. Each commit builds its memory. Each fork creates a new, independent captain.
- It runs on Cloudflare Workers, or locally on compatible hardware like a Jetson. It uses no permanent external databases.
- It uses an open protocol and can share information with other trusted vessels, but only with your explicit permission.
- It improves over time. Vessels in the fleet can share non-sensitive improvements back upstream if you choose.

---

## Quick Start

This becomes yours when you fork it.

1.  Fork and clone the repository.
2.  Install Wrangler and log in: `npx wrangler login`
3.  Set two secrets for your API keys:
    ```bash
    echo "your-github-token" | npx wrangler secret put GITHUB_TOKEN
    echo "your-llm-key" | npx wrangler secret put DEEPSEEK_API_KEY
    ```
4.  Deploy: `npx wrangler deploy`

Your vessel is now live.

## Features

- **Species Classification**: Identifies a range of salt and freshwater species. Runs locally; photos do not leave your device.
- **Captain Voice Interface**: Log catches, get conditions, and mark spots using voice commands over your boat speakers.
- **Conversational Training**: Correct its identifications. It uses your feedback to improve future interactions with you.
- **Bring Your Own Keys**: API keys are stored in Cloudflare Secrets, not in code.
- **Multi-Model Support**: Works with DeepSeek, SiliconFlow, DeepInfra, Moonshot, z.ai, and compatible local endpoints.
- **Session Memory**: Maintains context of your trips and catches during a session.
- **PII Safety**: By default, it removes precise locations and personal identifiers from any data shared externally.

**One Limitation**: Full offline functionality requires you to host and manage your own local inference endpoint for the AI model; the default cloud deployment still relies on external API calls.

---

<div align="center">
  <br>
  Part of the Cocapn Fleet.
  <br>
  <a href="https://the-fleet.casey-digennaro.workers.dev">The Fleet</a> ·
  <a href="https://cocapn.ai">Cocapn</a>
  <br><br>
  <sub>Attribution: Superinstance & Lucineer (DiGennaro et al.).</sub>
</div>