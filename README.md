# fishinglog-ai

<p align="center">
  <img src="https://raw.githubusercontent.com/Lucineer/capitaine/master/docs/capitaine-logo.jpg" alt="Capitaine" width="120">
</p>

<h3 align="center">An Edge AI Fishing Log</h3>

<p align="center">Log catches, identify species, and interact via voice. Runs on your own infrastructure.</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#limitations">Limitations</a> ·
  <a href="https://github.com/Lucineer/fishinglog-ai/issues">Issues</a>
</p>

---

**Live Instance:** [fishinglog-ai.casey-digennaro.workers.dev](https://fishinglog-ai.casey-digennaro.workers.dev)

---

You're on the water. Your hands are wet. The last thing you need is another app that requires menu navigation and sells your data.

This is a self-contained fishing log you host yourself. It uses local image classification and a voice interface to help you record catches without taking out your phone.

### How It Works
This is an agent built on the Cocapn Fleet protocol. You fork the repository and deploy it to a Cloudflare Worker. It uses your own API keys for its language model and stores its memory as commits to your repository. This design means you control all data and can run it offline on compatible hardware like a Jetson.

## Quick Start

Fork this repository to create your own independent copy.

1.  Clone your fork and install dependencies:
    ```bash
    git clone https://github.com/your-username/fishinglog-ai
    cd fishinglog-ai
    npm install
    ```
2.  Authenticate with Cloudflare:
    ```bash
    npx wrangler login
    ```
3.  Set your required API keys as secrets (these are stored in your Cloudflare account):
    ```bash
    npx wrangler secret put GITHUB_TOKEN # A token for your repo
    npx wrangler secret put DEEPSEEK_API_KEY # Or another LLM key
    ```
4.  Deploy:
    ```bash
    npx wrangler deploy
    ```

Your instance will be live at your assigned `*.workers.dev` domain.

## Features

*   **Local Species Classification**: Identifies common salt and freshwater species from photos using a local model. Photos are processed on your deployed Worker.
*   **Voice Interface**: Log catches and ask questions via voice commands using your device's microphone.
*   **Conversational Memory**: Corrections and notes you provide are saved to its repository-based memory for future sessions.
*   **Model Flexibility**: Configure it to use DeepSeek, SiliconFlow, local Llama.cpp servers, or any OpenAI-compatible API.
*   **Session Context**: Retains details about your current fishing trip, including location and recent activity.

## Limitations

The initial species classification model is a generalist. It performs well on clear, well-framed photos of common gamefish but can struggle with unusual species, poor lighting, or ambiguous angles. You train it by providing corrective feedback, which improves its future accuracy for your specific catches.

---
<div align="center">
  <sub>Part of the Cocapn Fleet. Built by <a href="https://superinstance.com">Superinstance</a> & <a href="https://lucineer.ai">Lucineer (DiGennaro et al.)</a>.</sub><br>
  <sub>Fleet: <a href="https://the-fleet.casey-digennaro.workers.dev">the-fleet.casey-digennaro.workers.dev</a> · Protocol: <a href="https://cocapn.ai">cocapn.ai</a></sub>
</div>