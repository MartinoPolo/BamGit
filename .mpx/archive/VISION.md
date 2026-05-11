## 1. Project Reframing Strategy

### What You Built (current framing)

"Grovekeeper — a desktop Git client with agent session management and tree visualization."

### What You Actually Built (correct framing)

**An AI agent orchestration platform** with:

- Multi-session spawning, monitoring, and adoption of AI coding agents
- Full stream-JSON protocol parser (928 lines, 4 event tiers, 15+ event types)
- Provider trait abstraction for pluggable AI backends (Claude, GPT, Codex, local models)
- Session state machines with real-time cost/token/duration tracking
- Worktree lifecycle management for parallel isolated workspaces
- Forest visualization mapping agent lifecycle to tree growth stages (11 stages)
- Cross-platform desktop app (Tauri v2 / Rust backend, Svelte 5 frontend)
- Notification system with per-event configuration and sound alerts
- Action/skill system with template variable interpolation

### Reframed Pitch (use this in CV, LinkedIn, blog posts)

> "I built an open-source AI agent orchestration platform that lets developers spawn,
> monitor, and evaluate multiple AI coding agents in parallel — with a forest visualization
> where each tree represents an agent's lifecycle, from seed (planning) to fruiting
> (delivering results) to dead stump (closed issue). Built with Tauri/Rust backend,
> Svelte 5 frontend, and SQLite persistence. Supports session adoption, multi-provider
> abstraction, and real-time cost tracking."

### What NOT to say

- Don't call it a "Git client" or "Git GUI"
- Don't lead with the visualization — lead with the orchestration, mention the visualization as the differentiator
- Don't say "I use Claude Code" — say "I build multi-agent orchestration systems"

---

## 3. Features to Add (AI Engineering Showcase)

Priority order. Each feature fills a specific gap in your AI engineering profile.

### P0: Evaluation Dashboard (Week 1-2)

**Why:** The #1 thing hiring managers say differentiates real AI engineers from API users. Almost nobody measures agent performance systematically.

**What to build:**

- Track per-session metrics: success/failure, tokens used, cost (USD), duration, number of tool calls
- Aggregate views: success rate by skill/task type, cost per successful task, token efficiency trends
- Comparative charts: model A vs model B on same task types
- Session outcome classification: success, partial, failure, abandoned (manual or auto-detected)
- Export metrics as JSON/CSV for analysis

**Skills demonstrated:** AI observability, evaluation methodology, data-driven AI engineering

### P1: RAG Integration (Week 2-3)

**Why:** RAG is the most in-demand AI engineering skill after basic LLM usage. Every job posting mentions it.

**What to build:**

- Index past session transcripts into a vector store (start with ChromaDB or LanceDB — both run locally, no cloud dependency)
- Generate embeddings using a local model (e.g., `all-MiniLM-L6-v2` via ONNX) or API (OpenAI/Voyage)
- Search UI: "How did I solve X last time?" → retrieves relevant past sessions
- Context injection: when spawning a new agent, optionally inject relevant past context from RAG
- Chunking strategy: split transcripts by tool-call boundaries (natural semantic units)

**Skills demonstrated:** Vector databases, embedding models, chunking strategies, retrieval pipeline design

### P2: Prompt Analytics (Week 3-4)

**Why:** Shows you think about prompt engineering as a systematic discipline, not ad-hoc tweaking.

**What to build:**

- Track which skill templates produce better outcomes
- Simple A/B comparison: same task, different prompt → which performed better?
- Prompt versioning: store prompt history per skill, correlate with outcome metrics
- Token budget analysis: which prompts are cost-efficient?

**Skills demonstrated:** Prompt engineering at systems level, experimentation, optimization

### P3: Model Comparison Engine (Week 4-5)

**Why:** Your provider trait abstraction already supports multiple backends. This makes it real.

**What to build:**

- Add at least 2 providers beyond Claude: OpenAI (GPT-4.1) and a local model (Ollama/llama.cpp)
- Run same task on multiple providers, display side-by-side results
- Compare: cost, speed, token usage, output quality (manual rating)
- Recommendation engine: "For this task type, Provider X is 40% cheaper with similar quality"

**Skills demonstrated:** Multi-model architecture, cost optimization, provider-agnostic design

### P4: Fine-tuning Experiment (Stretch goal)

**Why:** Proves you understand model adaptation beyond API calls.

**What to build:**

- Collect successful session transcripts as training data
- Fine-tune a small model (e.g., Mistral 7B via LoRA) on your specific task patterns
- Compare fine-tuned model vs base model on your eval metrics
- Document the process in a blog post

**Skills demonstrated:** Fine-tuning, LoRA, training data curation, model evaluation
