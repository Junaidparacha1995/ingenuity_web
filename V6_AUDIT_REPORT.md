# V6 Production Audit Report

## Fixed in this release

- Shared navigation simplified to Home / Services / Industries / Work / Company.
- Projects are surfaced under a prominent Work menu with recent projects, selected work, and engineering lab links.
- One H1 per content page.
- Semantic primary navigation and `<main>` landmarks across the site.
- Keyboard focus styling, dropdown ARIA state, assistant focus management, project filter semantics, and reduced-motion behavior.
- CSS split into maintainable cascade layers instead of one accumulated 150KB source file.
- Count-up metrics render real values without JavaScript and animate only when visible.
- Unsupported client-count / performance claims removed from the homepage and stale chatbot fallback.
- Selected Work language separates public engineering work from verified client engagements.
- Real `/api/contact` endpoint with validation, honeypot, rate limits, local persistence, and optional external lead webhook.
- Contact UI reports success only after the backend accepts the lead.
- Embedded strategy-call booking workspace.
- Opt-in first-party event analytics with a restricted event allowlist.
- RAG knowledge generation materializes animated values rather than indexing `0`.
- RAG source-of-truth JSON for company facts and project metadata.
- RAG sync reuses the vector store and updates only changed files.
- RAG response source links, request IDs, output cap, and stricter grounding prompt.
- Project root is no longer publicly exposed by Express; server code, scripts, knowledge files, `.env`, and runtime lead/event logs are private.
- Helmet CSP enabled, compression enabled, request timeouts and API rate limits added.
- Dynamic canonical URLs, Open Graph image/URL, JSON-LD, robots.txt, sitemap.xml, and proper 404 response.
- GitHub metadata refresh script with cached fallback.
- Responsive image dimensions/srcset/sizes/loading strategy for editorial photography.
- Canvas animation pauses offscreen/when the browser tab is hidden.
- Dependency versions pinned; Node 22+ required for the production server.
- Automated `npm run audit` checks structure and common regressions.

## Validation performed

- 30 HTML files audited (29 content pages + 404 page).
- No duplicate IDs detected.
- Every audited page has exactly one H1.
- Every content page has a main landmark and primary navigation landmark.
- No missing local href/src references detected.
- No legacy monolithic stylesheet link remains.
- No stale 60% / old unverified client-story claim remains.
- All project/server/client JavaScript files pass `node --check`.
- All five CSS layers parse without CSS syntax errors.
- RAG knowledge generation completes and now produces 31 knowledge sources, including structured company/project facts.

## External production inputs still required

These are configuration/content inputs rather than code defects:

1. `SITE_URL` — the real public domain.
2. `CONTACT_WEBHOOK_URL` — your real CRM/email/automation destination.
3. Approved client logos/testimonials/results if you want verified client case studies.
4. Real team/founder photos and bios if you want those sections to use only owned photography.
5. `OPENAI_API_KEY` — kept server-side only, if the professional RAG advisor is enabled.
