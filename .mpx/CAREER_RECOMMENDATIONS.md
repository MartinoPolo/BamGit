# Career Pivot: AI Engineering — Action Plan

Generated: 2026-04-23 | Context: Career pivot from fullstack web dev to AI engineering

---

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

## 2. Project Name Options

Current name "Grovekeeper" signals "Git tool." The tree metaphor is strong and should stay. The name should signal agent/AI orchestration, not Git.

| #   | Name            | Rationale                                                                       | Collision Risk     |
| --- | --------------- | ------------------------------------------------------------------------------- | ------------------ |
| 1   | **ForestGit**   | User's preference. Clear of collisions. Still has "Git" framing issue.          | LOW                |
| 2   | **Grovekeeper** | "One who tends a grove" — managing multiple agents. Unique, memorable.          | VERY LOW           |
| 3   | **Dendrite**    | Tree branching structure + neural dendrites (AI connection). Short, scientific. | LOW (check npm)    |
| 4   | **Copse**       | Small dense group of trees. Unusual, memorable, 5 letters.                      | LOW                |
| 5   | **Silvanus**    | Roman god of forests. Distinctive, brandable.                                   | LOW                |
| 6   | **Thicket**     | Dense cluster of trees/agents. Clear metaphor.                                  | MEDIUM (check npm) |
| 7   | **Rootstock**   | Foundation from which growth happens. Horticulture term.                        | LOW                |
| 8   | **Arboretum**   | Collection of trees for study/display. Fits "dashboard of agents."              | LOW                |
| 9   | **Canopyline**  | Combines canopy (forest top) with pipeline. Avoids "Canopy" collisions.         | VERY LOW           |
| 10  | **Understory**  | Forest layer beneath the canopy. Unique, evocative.                             | VERY LOW           |
| 11  | **Boughcraft**  | Bough = tree branch + craft = skill/making.                                     | VERY LOW           |
| 12  | **Timberline**  | Boundary where trees stop growing. Edge metaphor.                               | MEDIUM             |

**My top 3 recommendations:** Grovekeeper, Dendrite, or Arboretum. They're memorable, available, and don't anchor to Git.

**If you insist on keeping "Git" in the name:** ForestGit is the best option and collision-free.

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

---

## 4. Learning Plan (4-6 weeks, 10h/day before baby)

### Week 1: RAG Fundamentals + Build

**Study (3h/day):**

- What embeddings are and how they work (cosine similarity, vector spaces)
- Vector database concepts (indexing, approximate nearest neighbor search)
- Chunking strategies (fixed-size, semantic, recursive)
- Read: "AI Engineering" book chapters on RAG (if available)
- Watch: "RAG from Scratch" by LangChain on YouTube (well-structured series)

**Build (7h/day):**

- Add ChromaDB or LanceDB to your project (Rust bindings or Node sidecar)
- Index 10-20 of your past Claude Code session transcripts
- Build a search endpoint: query → top-K relevant chunks
- Add search UI in your app

### Week 2: LLM Internals + Evaluation Build

**Study (4h/day):**

- Transformer architecture: self-attention, multi-head attention, positional encoding
- Tokenization: BPE, SentencePiece, how context windows work
- Temperature, top-p, top-k sampling — what they actually do mathematically
- Read: "Attention Is All You Need" paper (skim, understand the diagrams)
- Watch: Andrej Karpathy's "Let's build GPT" YouTube video (excellent, math-friendly)

**Build (6h/day):**

- Add evaluation metrics tracking to your session system
- Build the eval dashboard UI (charts, tables, filters)
- Implement session outcome classification
- Add cost analytics views

### Week 3: Agent Frameworks + Prompt Analytics

**Study (3h/day):**

- LangGraph: graph-based agent orchestration (compare with your custom approach)
- CrewAI: role-based multi-agent patterns
- AutoGen: Microsoft's multi-agent framework
- Understand: how your custom orchestration compares to these frameworks

**Build (7h/day):**

- Add prompt tracking and versioning to your app
- Build A/B comparison UI for prompts
- Add at least one more provider to your provider trait (OpenAI or Ollama)
- Start model comparison feature

### Week 4: Fine-tuning + Polish

**Study (3h/day):**

- LoRA/QLoRA: parameter-efficient fine-tuning concepts
- Training data preparation and format (JSONL, chat format)
- Evaluation metrics for fine-tuned models (perplexity, task-specific benchmarks)
- Read: Hugging Face fine-tuning guides

**Build (7h/day):**

- Run a small fine-tuning experiment (even on a free Colab GPU)
- Complete model comparison engine
- Polish all dashboards, fix UI bugs
- Prepare demo screenshots/video

### Week 5-6: Marketing + Applications (reduced hours after baby)

**Write (2-3h/day):**

- Blog post: "Building a Multi-Agent Orchestration Platform from Scratch"
- Blog post: "Measuring AI Agent Performance: What I Learned from 500 Sessions"
- Rewrite CV as AI Engineer (see section 6)
- Update LinkedIn headline: "AI Engineer | Multi-Agent Orchestration | Evaluation Systems"
- Record a 3-5 minute demo video of your app

**Apply (1-2h/day):**

- Start applications (see target companies in section 5)
- Reach out to hiring managers directly on LinkedIn with your blog posts
- Post your demo on Twitter/X, Reddit r/LocalLLaMA, Hacker News "Show HN"

---

## 5. Target Companies

### Czech Republic

| Company                 | Location      | Why Relevant                                                                         | What to Search                |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------ | ----------------------------- |
| **JetBrains**           | Prague / Brno | Building AI Assistant product. Your agent orchestration experience directly applies. | careers.jetbrains.com → "AI"  |
| **Rossum**              | Prague        | AI-native document processing. Real ML/AI product company.                           | rossum.ai/careers             |
| **Resistant AI**        | Prague        | AI fraud detection. Applied AI roles.                                                | resistant.ai/careers          |
| **Kiwi.com**            | Brno          | ML in search/pricing. Large eng team, good culture.                                  | kiwi.com/careers → "ML", "AI" |
| **Productboard**        | Prague        | AI features in product management tool.                                              | productboard.com/careers      |
| **Red Hat**             | Brno          | Large engineering center, AI infra roles.                                            | redhat.com/jobs → Brno        |
| **Kentico**             | Brno          | AI in CMS/DXP. Closer to your web dev background.                                    | kentico.com/careers           |
| **SolarWinds**          | Brno          | AIOps, observability. Your eval dashboard experience relevant.                       | solarwinds.com/careers        |
| **Y Soft**              | Brno          | Print mgmt + robotics, some AI.                                                      | ysoft.com/careers             |
| **Blindspot Solutions** | Brno          | Geospatial AI.                                                                       | blindspot.ai/careers          |
| **Apify**               | Prague        | Web scraping + AI agents platform. Very relevant to your skills.                     | apify.com/careers             |
| **Deepnote**            | Prague        | Collaborative notebooks with AI features.                                            | deepnote.com/careers          |

### European Remote-Friendly

| Company                 | HQ                  | Why Relevant                                            | Hiring Page           |
| ----------------------- | ------------------- | ------------------------------------------------------- | --------------------- |
| **DeepL**               | Cologne, DE         | NLP/translation. Remote-friendly, strong engineering.   | deepl.com/careers     |
| **Mistral AI**          | Paris, FR           | European LLM company. Directly in the space.            | mistral.ai/careers    |
| **Poolside**            | Paris, FR           | AI coding tools. YOUR EXACT DOMAIN.                     | poolside.ai/careers   |
| **Hugging Face**        | Paris, FR           | ML platform. Open-source culture fits your style.       | huggingface.co/jobs   |
| **Weights & Biases**    | SF (remote EU)      | ML observability. Your eval dashboard aligns perfectly. | wandb.ai/careers      |
| **LangChain/LangSmith** | SF (remote)         | Agent framework company. You built a competing system.  | langchain.com/careers |
| **Cohere**              | Toronto (remote EU) | Enterprise LLM company.                                 | cohere.com/careers    |
| **Replit**              | SF (remote)         | AI coding. Agent orchestration relevant.                | replit.com/careers    |
| **Vercel**              | SF (remote EU)      | AI SDK, v0. Your fullstack + AI combo fits.             | vercel.com/careers    |

### Job Boards

| Board          | URL                | Search Terms                                           |
| -------------- | ------------------ | ------------------------------------------------------ |
| StartupJobs.cz | startupjobs.cz     | "AI engineer", "ML engineer", "backend"                |
| Jobs.cz        | jobs.cz            | "AI engineer", "umělá inteligence", "machine learning" |
| LinkedIn       | linkedin.com/jobs  | "AI Engineer" + Czech Republic / Remote + Europe       |
| Otta           | otta.com           | "AI Engineer" + Europe filter                          |
| RemoteOK       | remoteok.com       | "AI" + "Europe" filter                                 |
| WeWorkRemotely | weworkremotely.com | "AI", "ML", "machine learning"                         |
| Wellfound      | wellfound.com      | "AI Engineer" + Europe                                 |
| EuroTechJobs   | eurotechjobs.com   | "AI", "ML"                                             |

---

## 6. CV Rewrite Guide

### Current positioning (wrong)

"Fullstack Web Developer with 5 years of experience in React, Svelte, TypeScript"

### New positioning (correct)

"AI Engineer specializing in multi-agent orchestration systems. Built production agent platforms handling parallel AI sessions with real-time monitoring, evaluation, and multi-provider support. 5 years fullstack engineering (TypeScript, Svelte, React) + 2 years embedded systems (C/electronics)."

### Key CV sections

**Title:** AI Engineer / Agentic AI Developer

**Summary (3 lines max):**
Builder of AI agent orchestration systems. Created [ProjectName] — an open-source platform
for spawning, monitoring, and evaluating parallel AI coding agents with forest lifecycle
visualization. Strong fullstack engineering background (Svelte, TypeScript, Rust/Tauri).

**Projects section (lead with this, not work history):**

1. **[ProjectName]** — AI Agent Orchestration Platform
    - Multi-session agent management: spawn, monitor, adopt parallel AI coding sessions
    - Stream-JSON protocol parser for real-time agent event processing
    - Provider trait abstraction supporting Claude, GPT, and local models
    - Evaluation dashboard: success rates, cost analytics, token efficiency metrics
    - RAG-powered context retrieval from past agent sessions
    - Forest visualization: 11-stage tree lifecycle mapping agent progress
    - Tech: Tauri v2, Rust, Svelte 5, SQLite, ChromaDB

2. **mpx-claude-code** — AI Development Workflow Toolkit
    - 34 custom skills for AI-assisted development (TDD, review, architecture)
    - 6 parallel code reviewers across security, performance, best practices
    - Multi-agent orchestration with role clarity (executors vs. reviewers)
    - Pre-commit safety hooks: secret scanning, dangerous command blocking
    - Tech: Node.js, PowerShell, Claude Code MCP

**Work history (de-emphasize, keep brief):**

- Financial startup — AI-assisted fullstack development, multi-agent workflows (3 months, 2025-2026)
- [Company] — SvelteKit frontend development, 3D rendering (1+ year)
- [Company] — React/TypeScript frontend, Three.js (3+ years)
- [Company] — Embedded software development, automotive (2 years)

**Skills section:**

- AI Engineering: Multi-agent orchestration, RAG, evaluation systems, prompt engineering, LLM APIs
- Languages: TypeScript, Rust, Python, JavaScript, C
- Frontend: Svelte 5/SvelteKit, React, Tailwind CSS
- Backend: Node.js, SQLite, PostgreSQL, Drizzle ORM
- Desktop: Tauri v2
- Tools: Claude Code, Git, GitHub Actions, Docker

---

## 7. Realistic Timeline

```
NOW ─────────── WEEK 4 ──── WEEK 5-6 ──── WEEK 8 ──── WEEK 10-12
│                │            │              │            │
│ 10h/day        │ Baby       │ 2-3h/day     │ Ramp up    │ Target:
│ Build + Learn  │ arrives    │ Polish +     │ Apply      │ First
│ RAG, Eval,     │ 1 month   │ Blog posts   │ actively   │ interviews
│ Prompt metrics │ lighter    │ CV rewrite   │            │
```

### Key milestones

- **Week 2:** RAG search working in app. Eval dashboard showing real metrics.
- **Week 4:** Multi-provider comparison working. App demo-ready.
- **Week 6:** Two blog posts published. CV rewritten. LinkedIn updated.
- **Week 8:** First 20 applications sent. Demo video posted.
- **Week 10-12:** First interviews. Use the app as a live demo during interviews.

---

## 8. What Makes You Different (use in interviews)

Most "AI engineer" candidates can say:

- "I use ChatGPT/Claude for coding" — everyone does this now
- "I built a RAG chatbot" — thousands of tutorial followers

What you can say that almost nobody else can:

1. "I designed and built a multi-agent orchestration system from scratch — not with LangChain, but by understanding the protocol layer and building custom session management with Rust/Tokio"
2. "I created a provider abstraction that supports multiple AI backends through a unified trait system, similar to how LangChain works but purpose-built for coding agents"
3. "I built evaluation infrastructure that measures agent success rates, cost efficiency, and prompt effectiveness across hundreds of real sessions"
4. "I operated 3-5 parallel agents daily in a production financial startup, managing real tasks with real deadlines"
5. "I created 34 custom skills and a complete TDD-driven development pipeline orchestrated by AI agents"

These are things that take months to build. Tutorial followers can't fake this.

---

## 9. Risk Assessment

| Path                             | Expected Outcome                                  | Timeframe    | Risk       |
| -------------------------------- | ------------------------------------------------- | ------------ | ---------- |
| AI Engineering pivot (this plan) | 70% chance of job within 3-4 months               | 10-16 weeks  | LOW-MEDIUM |
| Continue applying for web dev    | 50% chance of job within 3-4 months, lower salary | 12-20 weeks  | MEDIUM     |
| Indie game development           | 5% chance of meaningful income within 18 months   | 18-36 months | VERY HIGH  |
| Freelance AI engineering         | 60% chance of first contract within 2-3 months    | 8-12 weeks   | MEDIUM     |

**Recommended approach:** Pursue AI engineering pivot as primary path. Apply for web dev roles as fallback. Explore freelance AI consulting in parallel. Do NOT pursue indie games as primary income path.

---

## 10. Investment Note

You mentioned wanting to invest again. One honest observation: you lost 70% of your wealth
in crypto. Before investing again, consider that your highest-ROI investment right now is
in your own skills and career positioning. An AI engineering salary of 120-180K CZK/month
(or 70-150K EUR/year remote) compounds more reliably than speculative assets. Get the
income stream stable first, then invest from surplus — not from reserves.
