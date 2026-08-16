# NOIRÉA

AI-powered personal wardrobe and outfit recommendation platform.

> 🚧 **Status: In active development.** Core chat assistant and wardrobe management are functional. AI-driven outfit recommendation, image analysis, and database persistence are in progress — see [Roadmap](#roadmap).

---

## Overview

NOIRÉA is a fashion assistant app being built to help users catalog their wardrobe, chat with an AI stylist, and — eventually — get outfit recommendations based on their own clothes. The project started as a chat interface and is being evolved step by step into a full fashion product, with each stage validated before moving to the next.

## Problem

Most people own more clothes than they actually wear, because it's hard to keep track of what they have and hard to know what combinations actually work. Generic fashion advice online doesn't account for what's already in someone's closet.

## Solution

NOIRÉA lets users log their own wardrobe items and asks an AI stylist for outfit suggestions grounded in what they actually own — not generic "what's trending" advice.

## Features

**Available now:**
- Style assistant chat (Groq-powered LLM, server-side)
- Chat sessions — create, rename, delete, edit messages (with automatic AI re-response)
- Wardrobe management — add, view, and delete clothing items (name, category, color, image URL)
- Local persistence (browser storage) for chat sessions and wardrobe items

**Planned:**
- AI wardrobe image analysis (auto-detect category/color from photos)
- Personal style profile
- AI outfit recommendations grounded in the user's actual wardrobe
- Mix & Match tool
- Saved looks
- User accounts and cloud persistence

## Architecture

```
app/
├── api/
│   └── chat/           → server-side Groq API handler
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
├── storage.ts            → localStorage persistence layer
└── utils.ts

types/
├── chat.ts                → Message, ChatSession
├── wardrobe.ts          → WardrobeItem, ClothingCategory
├── outfit.ts               → Outfit, OutfitWithItems
├── ai.ts                    → StyleRequest, StyleRecommendation
└── index.ts               → barrel export
```

The Groq API key lives only on the server (`app/api/chat/route.ts`). The client never talks to Groq directly — it calls the internal `/api/chat` route, which holds the key.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **AI:** Groq API (`llama-3.1-8b-instant`)
- **Persistence (current):** browser `localStorage`
- **Persistence (planned):** PostgreSQL + Prisma
- **Auth:** not yet implemented

## AI Pipeline

**Current:**
```
User message → /api/chat (server) → Groq LLM → response
```

**Planned:**
```
Wardrobe photo upload
        ↓
Image analysis
        ↓
Clothing classification (category, color)
        ↓
Style profile
        ↓
Outfit recommendation (grounded in user's own WardrobeItems)
```

## Database

Not yet implemented. Wardrobe and chat data currently persist in browser `localStorage` only, scoped per browser (not per user). Migration to PostgreSQL via Prisma is the next major milestone — see [Roadmap](#roadmap).

## Getting Started

**Prerequisites:** Node.js 18+, a [Groq API key](https://console.groq.com/keys)

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
```

> The key is server-side only (no `NEXT_PUBLIC_` prefix) — it is never exposed to the browser. Get a key from the [Groq Console](https://console.groq.com/keys).

## Testing

No automated test suite yet. Current verification is manual:
- `npm run dev` runs without TypeScript/build errors
- Chat send/receive and message editing work end-to-end
- Wardrobe add/delete persists across page refresh
- API key is not visible in browser DevTools → Network → Request Headers

Automated testing (unit/integration) is planned once the data layer (database) stabilizes.

## Deployment

Not yet deployed. Planned target: Vercel (Next.js-native), with a managed PostgreSQL instance once the database layer is implemented.

## Technical Decisions

- **API key handling:** All LLM calls go through a server-side API route (`app/api/chat/route.ts`) rather than calling Groq directly from the client, to keep the API key out of the browser bundle.
- **Prototype-first persistence:** `localStorage` is used deliberately before introducing a database, to validate the data model (`WardrobeItem`, `Outfit`, etc.) cheaply before committing to a schema.
- **Domain types over generic chat types:** `types/` was restructured so fashion-domain models (wardrobe, outfit, AI recommendation) are first-class, rather than treating the app as a generic chat client with a fashion-themed system prompt.
- **Incremental refactor:** Rather than a full rewrite, the existing chat-app foundation is being evolved feature-by-feature (see commit history on `feat/noirea-v2`), keeping the app runnable at every step.

## Roadmap

- [x] Fix critical bugs and security issues (API key exposure, broken imports, deprecated model)
- [x] Restructure `types/` around fashion domain models
- [x] Move LLM calls server-side
- [x] First wardrobe management page (localStorage-backed)
- [ ] Database integration (PostgreSQL + Prisma)
- [ ] Authentication
- [ ] AI outfit recommendation grounded in wardrobe data
- [ ] Wardrobe image upload + AI classification
- [ ] Automated testing
- [ ] Production deployment

## Screenshots

_Coming soon._

## Author

Reynacho A. Radan