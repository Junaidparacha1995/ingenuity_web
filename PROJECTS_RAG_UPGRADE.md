# Projects + RAG Upgrade

## Recent Projects
- Added `projects/index.html` as a first-class navigation tab.
- Added homepage Recent Engineering Projects preview.
- Added interactive terminal with commands: `help`, `list`, `filter`, `open`, `github`, `clear`, `about`.
- Added category filters and direct GitHub repository links.
- Portfolio content is explicitly presented as public engineering work rather than unverified client work.

## Chatbot
- Fixed the non-working chatbot caused by the main script executing before chatbot markup was parsed.
- Main `script.js` is now deferred on all website pages.
- Added server-side `/api/chat` route.
- Added OpenAI Responses API + hosted file-search RAG scaffold.
- Added local fallback mode for Live Server/static previews.
- Added source chips, booking actions, typing state, and online/fallback status.
- Added knowledge about Recent Projects.

## RAG Knowledge
- `scripts/build-knowledge.mjs` extracts website page content into `knowledge/generated/`.
- `scripts/setup-rag.mjs` creates and populates an OpenAI vector store.
- `.rag-store.json` is created locally after setup and is gitignored.
- `.env.example` keeps API credentials out of browser code.

## Motion
- Added count-up animation for key dashboard and portfolio metrics.
- Added terminal boot animation and live command interface.
- Added scan-line/code-pipeline effects with reduced-motion support.

## Run
Static preview: VS Code Live Server.
Professional RAG mode: `npm install` → configure `.env` → `npm run setup:rag` → `npm start` → open `http://localhost:3000`.
