# NOIRÉA

AI-powered personal wardrobe and outfit recommendation platform.

> 🚧 **Status: In active development.** Chat, authentication, database-backed wardrobe management, AI outfit recommendation, wardrobe image analysis, and saved outfits are functional. Supabase Storage, automated tests, and deployment remain planned.

---

## Overview

NOIRÉA helps users catalog their wardrobe, chat with an AI stylist, and get outfit recommendations based on clothes they already own. The project is being evolved step by step into a full fashion product, with each stage validated before moving to the next.

## Problem

Most people own more clothes than they actually wear, because it's hard to keep track of what they have and hard to know what combinations actually work. Generic fashion advice online doesn't account for what's already in someone's closet.

## Solution

NOIRÉA lets users log their own wardrobe items and asks an AI stylist for outfit suggestions grounded in what they actually own — not generic "what's trending" advice.

## Features

**Available now:**

- Style assistant chat (Groq-powered LLM, server-side)
- Chat sessions — create, rename, delete, edit messages (with automatic AI re-response)
- Supabase authentication with user ownership checks on API routes
- Prisma/PostgreSQL persistence for chat sessions, messages, and wardrobe items
- Wardrobe management — add, view, and delete clothing items (name, category, color, image)
- AI outfit recommendations grounded in the authenticated user's wardrobe
- Structured outfit recommendations from `/api/recommend`, with item ID validation
- Wardrobe image upload and AI classification of item name, category, and color
- Saved outfits with item ownership validation and delete support

**Planned:**

- Personal style profile
- Mix & Match tool
- Supabase Storage for durable image uploads
- Automated API and UI testing
- Production deployment

## Architecture

```
app/
├── api/
│   ├── chat/           → generic server-side Groq API handler
│   ├── recommend/      → structured wardrobe-grounded recommendations
│   ├── sessions/       → database-backed chat sessions and messages
│   ├── wardrobe/       → wardrobe CRUD and image analysis
│   └── saved-outfits/  → saved outfit CRUD
├── wardrobe/            → wardrobe management page
├── layout.tsx
└── page.tsx              → chat interface

components/
├── ui/                    → shared design system (Button, Card, Spinner, TextArea)
├── wardrobe/            → wardrobe-specific components
├── ChatBox.tsx
└── Sidebar.tsx

lib/
├── groq.ts               → client-side caller to /api/chat
├── ask.ts
└── utils.ts

types/
├── chat.ts                → Message, ChatSession
├── wardrobe.ts          → WardrobeItem, ClothingCategory
├── outfit.ts               → Outfit, OutfitWithItems
├── ai.ts                    → StyleRequest, StyleRecommendation
└── index.ts               → barrel export
```

The Groq API key lives only on the server (`lib/groq-server.ts`). The client never talks to Groq directly — it calls internal API routes, which hold the key and validate the authenticated Supabase user.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Groq API (`llama-3.1-8b-instant`)
- **Persistence (current):** browser `localStorage`
- **Persistence (planned):** PostgreSQL + Prisma
- **Auth:** not yet implemented

## AI Pipeline

**Current chat:**

```
User message → /api/sessions/[id]/messages → Groq LLM → Message in PostgreSQL
```

**Current structured recommendation:**

```
User prompt → authenticated wardrobe query → curated wardrobe context
        ↓
Groq JSON response → validate item IDs against user's wardrobe
        ↓
Visual outfit recommendation → optionally save to SavedOutfit
```

**Current image analysis:**

```
Browser file → data URL → `/api/wardrobe/analyze` → Groq vision model
        ↓
User reviews generated fields → wardrobe item saved in PostgreSQL
```

The current image flow is an interim implementation. Files are sent as data URLs and stored in the wardrobe record; Supabase Storage is still required for a production-ready upload flow.

## Database

Wardrobe items, chat sessions, messages, and saved outfits persist in PostgreSQL through Prisma. Supabase Auth provides the user identity, and API routes scope database queries to that user. Supabase Row Level Security is not yet enabled for the Prisma access path and remains production hardening work.

## Getting Started

**Prerequisites:** Node.js 18+, PostgreSQL database, Supabase project, and a [Groq API key](https://console.groq.com/keys)

```bash
git clone https://github.com/<your-username>/Noirea-AI.git
cd Noirea-AI
npm install
```

Create `.env.local` in the project root (see [Environment Variables](#environment-variables)), then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=your_postgres_connection_string
DIRECT_URL=your_postgres_direct_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> The key is server-side only (no `NEXT_PUBLIC_` prefix) — it is never exposed to the browser. Get a key from the [Groq Console](https://console.groq.com/keys).

## Testing

Current verification combines automated API tests, build checks, and manual feature testing:

- `npm test` runs the ownership and authentication route tests
- `npx tsc --noEmit` and `npm run build` pass
- Chat send/receive, session management, and message editing work end-to-end
- Authenticated wardrobe and saved outfit data is scoped to the signed-in user
- AI recommendation item IDs are restricted to the user's wardrobe
- API key is not exposed to the browser

The authenticated browser flow (login → add wardrobe item → analyze image → recommend outfit → save outfit → delete outfit) still requires manual verification with a configured Supabase account.

Automated testing (unit/integration) is planned once the data layer (database) stabilizes.

## Deployment

Not yet deployed. A future target is Vercel with Supabase PostgreSQL, Supabase Storage, and production environment variables.

## Technical Decisions

- **API key handling:** All LLM calls go through a server-side API route (`app/api/chat/route.ts`) rather than calling Groq directly from the client, to keep the API key out of the browser bundle.
- **Prototype-first persistence:** the initial localStorage prototype was migrated to Prisma/PostgreSQL once the domain model was validated.
- **Domain types over generic chat types:** `types/` was restructured so fashion-domain models (wardrobe, outfit, AI recommendation) are first-class, rather than treating the app as a generic chat client with a fashion-themed system prompt.
- **Incremental refactor:** Rather than a full rewrite, the existing chat-app foundation is being evolved feature-by-feature (see commit history on `feat/noirea-v2`), keeping the app runnable at every step.

## Roadmap

- [x] Fix critical bugs and security issues (API key exposure, broken imports, deprecated model)
- [x] Restructure `types/` around fashion domain models
- [x] Move LLM calls server-side
- [x] First wardrobe management page (localStorage-backed)
- [x] Database integration (PostgreSQL + Prisma)
- [x] Authentication
- [x] AI outfit recommendation grounded in wardrobe data
- [x] Wardrobe image upload + AI classification (interim data URL flow)
- [x] Saved looks
- [ ] Supabase Storage image uploads
- [ ] Personal style profile
- [ ] Mix & Match tool
- [ ] Automated testing
- [ ] Production deployment

## Screenshots

_Coming soon._

## Author

Reynacho A. Radan
