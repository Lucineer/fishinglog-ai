# fishinglog-ai 🎣

You stop writing good catch notes after the third beer. This remembers for you. Upload a photo for a species ID or ask a question about local techniques. It runs on your infrastructure and commits every interaction directly to your own repository.

**Live Instance:** [fishinglog-ai.casey-digennaro.workers.dev](https://fishinglog-ai.casey-digennaro.workers.dev)

Fork this repository, deploy it to a Cloudflare Worker with your API keys, and start logging. Every conversation and correction is saved as a commit to your fork. No one else holds your data.

## Why This Exists

Most fishing apps monetize your log data. This one doesn’t. It was built for anglers who prefer trusting their GitHub account over a third-party platform.

## Quick Start

1.  **Fork** this repository to your GitHub account.
2.  Clone your fork locally:
    ```bash
    git clone https://github.com/your-username/fishinglog-ai
    cd fishinglog-ai
    npm install
    ```
3.  Log in to Cloudflare:
    ```bash
    npx wrangler login
    ```
4.  Set your required secrets (you only do this once):
    ```bash
    # A GitHub token with 'repo' permissions
    npx wrangler secret put GITHUB_TOKEN
    # Your DeepSeek or other LLM API key
    npx wrangler secret put DEEPSEEK_API_KEY
    ```
5.  Deploy the Worker:
    ```bash
    npx wrangler deploy
    ```

Your instance is live in about 10 seconds. It only communicates with your repo and your chosen LLM API.

## What It Does

*   **Identify Fish:** Provides species identification for common North American saltwater and freshwater game fish from your photos.
*   **Answer Questions:** Responds to queries about techniques, regulations, or conditions based on the notes you’ve previously logged.
*   **Voice Logging:** Dictate catch notes hands-free.
*   **Own Your Data:** All logs are saved as Markdown files in your repository. There is no separate database or export step.
*   **Swap Models:** Configure it to use different compatible LLM APIs.

## Honest Limitation

Species identification is optimized for common North American game fish. It may struggle with rare species, juveniles, or photos where the fish occupies less than 10% of the frame.

## Architecture

This is a stateless agent built on the Cocapn Fleet protocol, running on a Cloudflare Worker. It has zero runtime dependencies and is MIT licensed.

<div style="text-align:center;padding:16px;color:#64748b;font-size:.8rem"><a href="https://the-fleet.casey-digennaro.workers.dev" style="color:#64748b">The Fleet</a> &middot; <a href="https://cocapn.ai" style="color:#64748b">Cocapn</a></div>