# Credence

**Consensus intelligence for human competence.**

Credence is a multi-module evaluation bureau built on the GenLayer Studio Network. It uses independent AI validators to assess the authenticity of credentials, the depth of claimed competency, the presence of genuine understanding versus AI dependence, and the legitimacy of a body of work. Every evaluation produces a permanent, on-chain case file.

Its defining feature is not the verdict. It is the **disagreement**. Credence surfaces where the validators agreed and, critically, where they split, turning the consensus mechanism itself into the product.

> Tagline: *Prove what you actually know.*

Live on GenLayer Studio Network. Contract address: `0x1c574AB4a372DD7502B925C2527a637CF3c3E642`

---

## The disagreement insight

A single AI verdict is an opinion. A panel of validators that all reach the same conclusion is a stronger signal. But the most useful signal is *where competent evaluators disagree*, because that is exactly where the interesting, contestable, human judgment lives.

GenLayer's optimistic-democracy consensus runs the same evaluation across multiple independent validators. Most applications treat that machinery as plumbing and only show the final agreed answer. Credence does the opposite. Every case file carries two fields that are the heart of the product:

- **Majority Position** — what most validators concluded, and why.
- **Minority Position** — where some validators dissented, and the specific tension that drove the split.

These read like the dissenting notes of a real evaluation panel. On a borderline credential or an ambiguous competency claim, the minority position is often more revealing than the verdict itself. This is a feature that only makes sense on a consensus-native platform like GenLayer. It cannot be replicated by a single model call.

---

## Four evaluation protocols

Each protocol is a distinct evaluation lens with its own scoring dimensions and verdict vocabulary.

### 1. Credential Verification
Evaluates issuer authenticity, formatting integrity, and legitimacy confidence of a submitted credential. Supports direct text entry or file upload (PDF, image, or plain text) with client-side extraction.

Verdicts range from *Strong Authenticity* through *Authenticity Contested* to *Likely Fabricated*.

### 2. Competency Validation
Assesses reasoning depth, domain accuracy, and genuine understanding beyond surface-level or memorized responses. Designed to be ruthless: technically correct but shallow answers score low.

Verdicts range from *Strong Competency* through *Basic Competency* to *Insufficient Evidence* and *AI Dependence Suspected*.

### 3. AI Dependence Detection
Identifies overreliance signals, originality markers, and genuine comprehension versus generic pattern matching. The framing is deliberate: AI assistance is not inherently disqualifying. The question is whether genuine understanding exists underneath.

Verdicts range from *Strong Independence* through *AI-Assisted but Understood* to *AI Overreliance Detected*.

### 4. Portfolio Authenticity
Verifies contribution evidence, technical depth, and originality of a described body of work. Looks for consistent growth and real problem-solving evidence rather than scaffolded or copied content.

Verdicts range from *Strong Portfolio* through *Depth Insufficient* to *Originality Questioned*.

---

## How it works

```
User submits subject material (text or uploaded file)
        │
        ▼
Frontend captures submitter address & timestamp client-side
        │
        ▼
analyze() write method on the Credence contract
        │
        ▼
gl.vm.run_nondet_unsafe — leader runs the evaluation prompt,
validators independently re-run & reach consensus
        │
        ▼
Structured verdict written to flat parallel TreeMaps on-chain
        │
        ▼
Case file rendered: verdict, dimensional assessment,
majority & minority positions, findings, recommendation
```

The contract builds a protocol-specific prompt, runs it inside a nondeterministic consensus block, and persists a structured result. Each result becomes a permanent case file addressable by ID, browsable in the public Archive, and filterable to the submitting wallet under My Files.

---

## Architecture

### Smart contract

Written in Python for the GenLayer runtime. The storage model uses **flat parallel TreeMaps** keyed by result ID rather than packed dataclasses. This is a deliberate choice: storing structured data in `@allow_storage` dataclasses inside a write method that also calls the consensus primitives can trigger a silent storage rollback, where the transaction reports success but the state never persists. Flat primitive maps avoid that failure mode entirely.

The submitter address and submission timestamp are passed in as function arguments rather than read from `gl.message.sender_address` or `gl.block.timestamp` inside the write method, for the same reason. Reading those globals inside a consensus write path is unsafe in this runtime.

All LLM evaluation runs inside a single nondeterministic consensus block. The leader produces the structured verdict, and validators reach agreement on it. Scores are stored as `u64`, free-text fields as strings, and the findings list as a JSON-encoded string that the frontend parses back into an array.

Key public views:

- `analyze(...)` — submit material for evaluation, returns the new case file ID.
- `get_result(result_id)` — fetch a single case file.
- `get_all_results()` — the full public archive, newest first.
- `get_results_by_submitter(address)` — case files for one wallet.
- `get_result_count()` — total case files on record.

### Frontend

React 18 with TypeScript, Vite, and React Router. On-chain reads and writes go through `genlayer-js`. No backend. No database. The contract is the only source of truth.

Routes:

- `/` — editorial home with the four protocols and recent filings.
- `/analyze` — protocol selection and evaluation intake.
- `/result/:id` — the full case file view.
- `/archive` — all public case files, filterable by protocol.
- `/my-files` — case files for the connected wallet.

The visual identity is "The Credibility Bureau": near-monochrome with a single gold accent, editorial serif for verdicts, monospace for technical labels, and tabular block-character signal bars rather than rounded progress meters. The intent is the weight of an institutional research note, not a consumer dashboard.

---

## Credential file upload

The Credential Verification protocol accepts file uploads, extracted entirely in the browser. Nothing is sent to a server. The uploaded file never leaves the user's machine.

- **Digital PDFs** are read directly from their text layer. No OCR, clean text.
- **Scanned or photographed PDFs** are detected when the text layer comes back empty, then rendered page-by-page to a canvas and run through OCR.
- **Images** (PNG, JPG, WEBP) are run through OCR directly.
- **Plain text** is read as-is.

`pdfjs-dist` handles PDF text and rendering. `tesseract.js` handles OCR. Both are lazy-loaded via dynamic import, so they only download when a user actually uploads a file, keeping the rest of the app lean.

Extracted text lands in an editable field. A conservative auto-clean pass removes predictable scanner noise (stray frame characters, leaked progress artifacts, isolated single letters) while deliberately leaving genuinely garbled OCR for the user to review. The user stays in control of exactly what gets evaluated.

### An honest boundary

OCR extracts the **text** of a credential. It cannot preserve the **visual** authenticity signals: an embossed seal, a physical signature, security paper, template fidelity. Those are precisely the cues a human uses to spot a forgery, and they flatten to noise in text.

So Credence V1 evaluates **textual authenticity** (does the content read like a legitimate credential) rather than **visual authenticity** (is this scan doctored). This is a real and useful capability, framed honestly. True visual verification is a V2 direction: a vision model in a frontend edge function producing a structured visual description, with that description joining the text on-chain. The contract stays text-only; the consensus mechanism is untouched. The door is open, the scope is deliberately deferred.

---

## Running locally

Requires Node 18 or newer and a browser wallet (MetaMask) configured for the GenLayer Studio Network.

```bash
cd frontend
npm install
npm run dev
```

The app reads from the deployed contract by default. To point it at a different deployment, set an environment variable:

```bash
# frontend/.env
VITE_CONTRACT_ADDRESS=0xYourContractAddress
```

### Network configuration

| Field | Value |
| --- | --- |
| Network | GenLayer Studio |
| Chain ID (decimal) | 61999 |
| Chain ID (hex) | 0xF22F |

The app enforces the correct chain before every write, prompting a wallet network switch if needed.

### Build

```bash
npm run build
```

Output goes to `frontend/dist`. The included `vercel.json` configures the Vite framework preset and SPA rewrites for client-side routing.

---

## Deployment

The frontend deploys to Vercel with the project root set to `frontend/` and `VITE_CONTRACT_ADDRESS` set as an environment variable. SPA rewrites are handled by `vercel.json`, so deep links such as `/result/credence_0` resolve correctly.

The contract is already deployed and verified on the Studio Network at the address above. Redeployment is only needed when the contract logic itself changes.

---

## Project structure

```
credence/
├── contracts/
│   └── credence.py          # GenLayer smart contract
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── analysis/     # ProtocolSelector, AnalysisForm,
│   │   │   │                 # FileDropZone, BureauLoader
│   │   │   └── layout/       # Header, Footer
│   │   ├── hooks/            # useWallet, useAnalyze, useResult
│   │   ├── lib/              # genlayer client, constants, extractText
│   │   ├── pages/            # Home, Analyze, Result, Archive, MyFiles
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vercel.json
│   └── package.json
└── README.md
```

---

## Technical notes

A short record of the non-obvious decisions, kept for anyone building on the GenLayer runtime.

- **Storage:** flat parallel TreeMaps keyed by result ID. No `@allow_storage` dataclasses inside consensus write methods, to avoid silent storage rollback.
- **Context globals:** `submitter_address` and `submitted_at` are passed as arguments, never read from runtime globals inside the write path.
- **Consensus:** all LLM calls live inside a single nondeterministic block. The validator path reaches agreement on the leader's structured output.
- **Findings:** stored as a JSON string in a `TreeMap[str, str]`, parsed back to an array client-side.
- **Wallet account:** `genlayer-js` rides on viem 2.x, which requires the account as a JsonRpcAccount object, not a plain address string.
- **Chain enforcement:** the correct chain is enforced before every write, not only at connect time, to avoid a chain-mismatch error if the wallet drifts to another network mid-session.
- **Gas:** scaled to input length, `8_000_000 + (inputLength × 200)`.

---

## Built on GenLayer

Credence runs on the GenLayer Studio Network and uses its validator consensus as the core of the product rather than as background infrastructure. The majority and minority positions on every case file exist only because GenLayer runs real independent evaluation across validators. That is the foundation the entire bureau is built on.
