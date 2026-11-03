# Architecture — Meri Kahani

Diagrams use Mermaid (they render on GitHub and in many Markdown viewers). They describe the system as built on 2026-11-03.

---

## 1. System architecture

```mermaid
flowchart LR
    subgraph Browser["Parent's browser (phone / computer)"]
        UI["Pages: / · /kahani · /kavita<br/>StoryForm / PoemForm"]
        RS["readTextStream.js<br/>shows words as they arrive"]
        VP["VoicePlayer.js<br/>Web Speech API (device voices)"]
        SB["ShareButtons.js<br/>WhatsApp link · Copy"]
    end

    subgraph Vercel["Next.js on Vercel (server)"]
        R1["POST /api/story"]
        R2["POST /api/kavita"]
        SAF["lib/safety.js<br/>input check · word filter"]
        RL["lib/rateLimit.js<br/>5 per hour (memory)"]
        PR["lib/storyPrompt.js<br/>lib/poemPrompt.js"]
        AI["lib/ai.js<br/>streamAI() · model fallback"]
        SR["lib/streamResponse.js<br/>stream + end marker"]
        ENV[("Env var:<br/>GEMINI_API_KEY")]
    end

    subgraph Google["Google Gemini API (free tier)"]
        M1["gemini-3.5-flash-lite<br/>(main)"]
        M2["gemini-3.6-flash<br/>(backup)"]
    end

    WA["WhatsApp (wa.me)"]

    UI -->|"JSON form details"| R1
    UI -->|"JSON form details"| R2
    R1 --> SAF --> RL
    R2 --> SAF
    RL --> PR --> AI
    ENV -.-> AI
    AI -->|"stream: true<br/>thinking minimal"| M1
    AI -.->|"only if busy/limit<br/>before first text"| M2
    M1 -->|"text pieces"| AI
    AI --> SR
    SR -->|"text/plain stream<br/>+ OK/UNSAFE/ERROR"| RS
    RS --> UI
    UI --> VP
    UI --> SB
    SB --> WA
```

**Key points**
- The browser never sees the API key; only the server calls Gemini.
- No database: nothing is saved. The usage limit keeps only addresses and times, in memory.
- `lib/ai.js` is the single switch point to change the AI provider.
- Voice runs entirely in the browser using the device's own voices.

---

## 2. Sequence: creating a story

```mermaid
sequenceDiagram
    autonumber
    actor P as Parent
    participant B as Browser (StoryForm)
    participant S as /api/story (Vercel)
    participant L as safety + rateLimit
    participant A as lib/ai.js
    participant G as Gemini API

    P->>B: Fill form, press "Create Story"
    B->>B: Show "Creating your story... 🌙"
    B->>S: POST JSON {childName, age, language, family, favourites, value}
    S->>L: Check choices, name, lengths, blocked words
    alt Problem in form
        L-->>S: Message
        S-->>B: 400 {error}
        B-->>P: Polite message
    else Limit reached (5/hour)
        S-->>B: 429 {error: "That's a lot of stories for now!..."}
        B-->>P: Limit message
    else OK
        S->>A: streamAI(STORY_RULES, request, maxTokens 4096)
        A->>G: interactions.create(stream, thinking minimal, store false)
        alt Main model busy / out of limit (before any text)
            G-->>A: 429 / 503
            A->>G: Retry once with backup model
        end
        G-->>A: First text piece (~1–2 s)
        A-->>S: yield text
        S-->>B: 200 text/plain (stream starts)
        loop Until finished
            G-->>A: More text
            A-->>S: yield text
            S-->>B: text piece
            B-->>P: Words appear ("✍️ Still writing...")
        end
        S->>S: isTextClean(full story)
        alt Clean
            S-->>B: END + "OK"
            B-->>P: Show Listen · Share on WhatsApp · Copy · New Story
        else Blocked word
            S-->>B: END + "UNSAFE"
            B-->>P: Hide text, friendly message
        end
    end
```

The poem flow is the same, using `/api/kavita`, `POEM_RULES` and `maxTokens 1536`.

---

## 3. Deployment: local development vs Vercel production

```mermaid
flowchart TB
    subgraph Local["Local development (this computer)"]
        DEV["npm run dev<br/>Next.js dev server<br/>http://localhost:3000"]
        ENVL[(".env.local<br/>GEMINI_API_KEY<br/>VERCEL_OIDC_TOKEN")]
        CODE["Project folder<br/>app/ · lib/ · docs/"]
        CLI["Vercel CLI<br/>vercel deploy --prod --yes"]
        ENVL -.-> DEV
        CODE --> DEV
        CODE --> CLI
    end

    subgraph VercelCloud["Vercel (Hobby plan) — project meri-kahani, team checkmate16"]
        BUILD["Build: next build<br/>(vercel.json: framework nextjs)"]
        STATIC["Static pages<br/>/ · /kahani · /kavita"]
        FUNCS["Serverless functions<br/>/api/story · /api/kavita<br/>maxDuration 60 s"]
        ENVV[("Environment variables<br/>GEMINI_API_KEY<br/>Production + Preview")]
        URL["https://meri-kahani-nine.vercel.app"]
        BUILD --> STATIC
        BUILD --> FUNCS
        ENVV -.-> FUNCS
        STATIC --> URL
        FUNCS --> URL
    end

    GEM["Google Gemini API"]
    USERS["Parents' browsers"]

    CLI -->|"upload (minus .vercelignore:<br/>.env*, node_modules, .next, .git,<br/>docs, CLAUDE.md, AGENTS.md)"| BUILD
    DEV --> GEM
    FUNCS --> GEM
    USERS --> URL
```

| | Local | Production |
|---|---|---|
| Start | `npm run dev` | `vercel deploy --prod --yes` |
| URL | http://localhost:3000 (or the Network address on the same Wi-Fi) | https://meri-kahani-nine.vercel.app |
| Key comes from | `.env.local` | Vercel environment variables |
| Usage limit memory | One process; resets on restart | Per server copy (approximate) |
| Git | Not needed for deploy | Not connected (Planned: GitHub auto-deploy) |
