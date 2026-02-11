# 🎤 Interview Mode — Implementation Plan

## Existing Architecture Overview

| Layer         | Tech           | What Exists Today                          |
|---------------|----------------|--------------------------------------------|
| **Auth**      | Firebase       | Google/GitHub login, `authFetch`, token mgmt |
| **DB**        | MongoDB/Mongoose | `User` model (with `plan` field), `Design` model (nodes/connections) |
| **API**       | Next.js API Routes | `/api/designs`, `/api/designs/[id]`, `/api/user` |
| **Canvas**    | React          | `DesignCanvas`, `ComponentPalette`, `CanvasHeader`, `PropertiesPanel`, `AIFeedbackPanel` |
| **AI**        | Gemini API     | `GEMINI_API_KEY` in `.env` (ready to use)  |

---

## Phase 1: Data Models & API Foundation
> **Goal:** Build the database layer and core API routes

### 1A. InterviewSession Model (`src/lib/db/models/InterviewSession.ts`)
```typescript
interface IInterviewSession {
  userId: ObjectId;              // ref User
  
  // Question
  question: {
    prompt: string;              // Human-readable question  
    requirements: string[];      // Functional requirements
    constraints: string[];       // Scale constraints
    trafficProfile: {
      users?: string;            // e.g. "10M daily active"
      rps?: string;              // e.g. "50k requests/sec"
      storage?: string;          // e.g. "500TB media"
    };
    hints: string[];             // Optional hints
  };
  difficulty: 'easy' | 'medium' | 'hard';
  
  // Timing
  timeLimit: number;             // minutes (30 | 45 | 60)
  startedAt: Date;
  submittedAt?: Date;
  
  // Status
  status: 'in_progress' | 'submitted' | 'evaluating' | 'evaluated';
  
  // Canvas snapshot (on submission)
  canvasSnapshot: {
    nodes: ICanvasNode[];
    connections: IConnection[];
  };
  
  // Evaluation results
  evaluation?: {
    structural: {
      score: number;             // 0-100
      passedRules: string[];
      failedRules: string[];
      details: { rule: string; status: 'pass' | 'fail'; message: string }[];
    };
    reasoning: {
      score: number;             // 0-100
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    };
    finalScore: number;          // Weighted combined
    weights: { structural: number; reasoning: number }; // e.g. 0.6, 0.4
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Indexes:** `{ userId: 1, createdAt: -1 }`, `{ userId: 1, status: 1 }`

### 1B. Usage Tracking (Add to User model)
```typescript
// Add to IUser interface
interviewAttempts: {
  count: number;           // attempts this week
  weekStart: Date;         // start of current week
};
```
- Free plan: **2 interviews/week**
- Pro plan: **unlimited**
- Reset logic: if `weekStart` is more than 7 days ago, reset `count` to 0

### 1C. API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/interview` | `GET` | ✅ | List user's sessions (paginated) |
| `/api/interview` | `POST` | ✅ | Start new session (generates question) |
| `/api/interview/[id]` | `GET` | ✅ | Get session details |
| `/api/interview/[id]` | `PUT` | ✅ | Submit canvas / auto-save |
| `/api/interview/[id]/evaluate` | `POST` | ✅ | Trigger evaluation |

### Dependencies: None (this is the foundation)
### Estimated effort: 1 day

---

## Phase 2: Question Generation Engine
> **Goal:** AI generates structured system design questions

### 2A. Gemini Client (`src/lib/ai/geminiClient.ts`)
- Initialize `@google/generative-ai` SDK with `GEMINI_API_KEY`
- Create reusable client with model selection (gemini-2.0-flash for speed)
- Add retry logic and error handling

### 2B. Question Generator (`src/lib/ai/questionGenerator.ts`)
```typescript
async function generateQuestion(difficulty: 'easy' | 'medium' | 'hard'): Promise<InterviewQuestion>
```

**Difficulty mapping:**
| Level | Users | RPS | Constraints | Example Questions |
|-------|-------|-----|-------------|-------------------|
| Easy | <1M | <1k | Basic CRUD | URL shortener, Pastebin |
| Medium | 1-50M | 1k-50k | Caching, CDN | Twitter feed, Instagram |
| Hard | 50M+ | 50k+ | Multi-region, CQRS | YouTube, Uber |

**Gemini prompt strategy:**
```
You are a system design interviewer. Generate a structured question.

Difficulty: {difficulty}

Return ONLY valid JSON:
{
  "prompt": "Design a ... ",
  "requirements": ["Functional requirement 1", ...],
  "constraints": ["Must handle 10M users", ...],
  "trafficProfile": { "users": "10M DAU", "rps": "50k", "storage": "..." },
  "hints": ["Consider using...", ...]
}
```

### 2C. Integration with POST `/api/interview`
- Validate user hasn't exceeded weekly limit
- Call `generateQuestion(difficulty)`
- Create `InterviewSession` with generated question
- Return session (with question, without hints initially)

### Dependencies: Phase 1 (models must exist)
### Estimated effort: 1 day

---

## Phase 3: Interview UI & Timer System
> **Goal:** Build the interview experience pages

### 3A. Interview Landing Page (`app/interview/page.tsx`)
```
┌─────────────────────────────────────────────────────────────┐
│  🎤 Interview Mode                                         │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │  Easy    │ │  Medium  │ │   Hard   │  ← Difficulty     │
│  │  30 min  │ │  45 min  │ │  60 min  │  ← Time limit     │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
│  [Start Interview]                                          │
│                                                             │
│  ── Past Attempts ──────────────────────────────────────   │
│  │ URL Shortener    │ Easy  │ 78/100  │ Feb 10  │ View │  │
│  │ Twitter Feed     │ Med   │ 65/100  │ Feb 8   │ View │  │
│  │ YouTube Design   │ Hard  │ --      │ Feb 7   │ Resume│  │
│  ──────────────────────────────────────────────────────    │
│                                                             │
│  Free plan: 1/2 attempts used this week                    │
└─────────────────────────────────────────────────────────────┘
```

### 3B. Interview Canvas Page (`app/interview/[id]/page.tsx`)
Reuses existing `DesignCanvas` + `ComponentPalette` with additions:

```
┌──────────────────────────────────────────────────────────────────┐
│  CanvasHeader: [Back] [Question Title]           ⏱ 23:45  [Submit]│
├─────────────┬────────────────────────────────────┬───────────────┤
│             │                                    │               │
│  Question   │                                    │  Component    │
│  Panel      │        Design Canvas               │  Palette      │
│             │        (same as /canvas)            │  (same)       │
│  - Prompt   │                                    │               │
│  - Reqs     │                                    │               │
│  - Constr.  │                                    │               │
│  - Hints    │                                    │               │
│  (toggle)   │                                    │               │
│             │                                    │               │
├─────────────┴────────────────────────────────────┴───────────────┤
│  Status bar: Auto-saved 5s ago  │  Components: 6  │  Arrows: 8  │
└──────────────────────────────────────────────────────────────────┘
```

### 3C. Timer System (React hook: `useInterviewTimer`)
```typescript
function useInterviewTimer(startedAt: Date, timeLimitMinutes: number) {
  returns {
    timeRemaining: number;     // seconds
    formattedTime: string;     // "23:45"
    isWarning: boolean;        // < 5 min
    isExpired: boolean;        // time's up
    progress: number;          // 0-100 for progress bar
  }
}
```
- Warning at 5 minutes (pulsing red timer)
- Auto-save canvas every 30 seconds
- On expiry: auto-submit

### 3D. Question Panel Component (`components/interview/QuestionPanel.tsx`)
- Shows question prompt, requirements, constraints
- Expandable hints section
- Traffic profile visualization

### Dependencies: Phase 1 + 2 (API and question generation)
### Estimated effort: 2-3 days

---

## Phase 4: Evaluation Engine
> **Goal:** Score the submitted design

### 4A. Canvas Submission (`PUT /api/interview/[id]`)
- Accept `{ action: 'submit', nodes: [], connections: [] }`
- Freeze canvas snapshot in DB
- Set status to `submitted`
- Trigger evaluation (async via `POST /api/interview/[id]/evaluate`)

### 4B. Structural Rule Engine (`src/lib/evaluation/structuralRules.ts`)

**100% deterministic — no AI needed.**

```typescript
interface RuleResult {
  rule: string;
  status: 'pass' | 'fail';
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

function evaluateStructure(
  nodes: ICanvasNode[],
  connections: IConnection[],
  requirements: string[],
  constraints: string[]
): { score: number; results: RuleResult[] }
```

**Rule categories:**

| Category | Rules |
|----------|-------|
| **Presence** | Has load balancer? Has database? Has cache? Has CDN for media? |
| **Flow** | LB connects to servers? Servers connect to DB? Cache sits between server & DB? |
| **Redundancy** | Multiple servers? No single point of failure? DB has replica? |
| **Scalability** | Message queue for async? CDN for static content? Cache layer present? |
| **Graph Health** | No orphan nodes? No unreachable nodes? All nodes connected? |

**Scoring:** Each rule has a weight. Sum of passed rule weights / total weight × 100.

### 4C. AI Reasoning Evaluator (`src/lib/evaluation/reasoningEvaluator.ts`)

```typescript
async function evaluateReasoning(
  question: InterviewQuestion,
  canvasSnapshot: { nodes: ICanvasNode[]; connections: IConnection[] },
  structuralResults: RuleResult[]
): Promise<{
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}>
```

**Gemini prompt:**
```
You are a senior system design evaluator.

QUESTION:
{question.prompt}

REQUIREMENTS:
{question.requirements}

CONSTRAINTS:
{question.constraints}

USER'S DESIGN (JSON):
{canvasSnapshot}

STRUCTURAL ANALYSIS:
{structuralResults}

Evaluate the design on:
1. Does it meet ALL functional requirements?
2. Are trade-offs appropriate for the constraints?
3. Are bottlenecks identified and addressed?
4. Is the architecture justified and coherent?

Return ONLY valid JSON:
{
  "score": 0-100,
  "strengths": ["...", ...],
  "weaknesses": ["...", ...],
  "suggestions": ["...", ...]
}
```

### 4D. Scoring Engine (`src/lib/evaluation/scoringEngine.ts`)
```typescript
function computeFinalScore(
  structuralScore: number,
  reasoningScore: number,
  weights = { structural: 0.6, reasoning: 0.4 }
): number {
  return Math.round(weights.structural * structuralScore + weights.reasoning * reasoningScore);
}
```

### Dependencies: Phase 1 + 2 (needs models and AI client)
### Estimated effort: 2-3 days

---

## Phase 5: Results Dashboard
> **Goal:** Show evaluation results with visual feedback

### 5A. Results Page (`app/interview/[id]/result/page.tsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Interview Results                                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        FINAL SCORE: 78/100  ⭐⭐⭐⭐☆                    │   │
│  │   ┌──────────┐  ┌──────────────┐                        │   │
│  │   │Structure │  │  Reasoning   │                        │   │
│  │   │  82/100  │  │   72/100     │                        │   │
│  │   │  (60%)   │  │   (40%)      │                        │   │
│  │   └──────────┘  └──────────────┘                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ── Structural Rules ──────────────────────────────────────     │
│  ✅ Load balancer present                                        │
│  ✅ Database connected to servers                                │
│  ❌ No cache layer detected (CRITICAL)                           │
│  ❌ Single point of failure: only 1 server                       │
│  ⚠️  No CDN for static content                                  │
│                                                                  │
│  ── AI Feedback ────────────────────────────────────────────    │
│  💪 Strengths: [...]                                            │
│  ⚠️  Weaknesses: [...]                                          │
│  💡 Suggestions: [...]                                           │
│                                                                  │
│  ── Your Design ────────────────────────────────────────────    │
│  [Read-only canvas with failed nodes highlighted in red]         │
│                                                                  │
│  [Download PDF]  [Try Again]  [Back to Dashboard]               │
└──────────────────────────────────────────────────────────────────┘
```

### 5B. PDF Export (`src/lib/evaluation/pdfExport.ts`)
- Use `jspdf` or `@react-pdf/renderer`
- Include: question, score breakdown, rule results, AI feedback
- Branded with SystemCraft logo

### 5C. Read-only Canvas View
- Reuse `DesignCanvas` in `readOnly` mode
- Highlight failed nodes with red outlines
- Show tooltips on hover explaining failures

### Dependencies: Phase 3 + 4 (needs evaluation data)
### Estimated effort: 2 days

---

## Implementation Order (Critical Path)

```
Week 1:
  Day 1: Phase 1 — Models + API routes
  Day 2: Phase 2 — Gemini client + question generator
  Day 3-4: Phase 3 — Interview UI + timer + question panel
  
Week 2:
  Day 5-6: Phase 4 — Rule engine + AI evaluator + scoring
  Day 7-8: Phase 5 — Results dashboard + PDF export
  Day 9: Polish + testing + usage limiting
```

---

## File Structure (New Files)

```
src/lib/
├── ai/
│   ├── geminiClient.ts          ← Gemini SDK wrapper
│   └── questionGenerator.ts     ← Question generation
├── evaluation/
│   ├── structuralRules.ts       ← Deterministic rule engine
│   ├── reasoningEvaluator.ts    ← AI reasoning scorer
│   ├── scoringEngine.ts         ← Weighted final score
│   └── pdfExport.ts             ← PDF report generator
└── db/models/
    └── InterviewSession.ts      ← New model

app/
├── api/interview/
│   ├── route.ts                 ← GET (list) + POST (start)
│   └── [id]/
│       ├── route.ts             ← GET (detail) + PUT (submit/save)
│       └── evaluate/
│           └── route.ts         ← POST (trigger evaluation)
└── interview/
    ├── page.tsx                 ← Landing page
    └── [id]/
        ├── page.tsx             ← Interview canvas
        └── result/
            └── page.tsx         ← Results dashboard

components/interview/
├── QuestionPanel.tsx            ← Question display sidebar
├── InterviewTimer.tsx           ← Timer display
├── DifficultySelector.tsx       ← Start page difficulty cards
├── SessionCard.tsx              ← Past attempt card
├── ScoreBreakdown.tsx           ← Results visualization
├── RuleResultsList.tsx          ← Structural rules display
└── AIFeedbackCard.tsx           ← AI reasoning feedback
    
hooks/
└── useInterviewTimer.ts         ← Timer hook
```

---

## Tech Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI Model | Gemini 2.0 Flash | Fast, cheap, good at structured JSON |
| PDF | `jspdf` | Lightweight, no server-side rendering needed |
| Timer | React hook + `setInterval` | Simple, reliable |
| Rule engine | Pure TypeScript functions | Deterministic, testable, no AI cost |
| Auto-save | `setInterval` + `PUT` API | 30s interval, debounced |
| Usage limit | DB field on User | Simple, no external service |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Gemini returns malformed JSON | JSON.parse with fallback, retry once |
| User closes tab mid-interview | Auto-save every 30s, can resume |
| Rule engine too rigid | Start with core rules, mark as v1, iterate |
| Evaluation takes too long | Show "Evaluating..." state, async processing |
| Free tier abuse | Rate limit at API level + DB tracking |
