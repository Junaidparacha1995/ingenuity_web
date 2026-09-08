# Ingenuity Systems on Replit

## Run

- Runtime: Node.js 22
- Install dependencies from `package-lock.json`.
- Start the web app with `PORT=5000 npm start`.
- The Replit workflow named `Start application` serves the site in the web preview.

## Optional configuration

- The core website, clean routes, contact form local storage, and opt-in event logging work without external services.
- The AI/RAG advisor requires an OpenAI connection plus a one-time `npm run setup:rag`.
- `CONTACT_WEBHOOK_URL` enables external lead delivery; without it, accepted leads are stored privately in `.runtime/leads.ndjson`.
- `ANALYTICS_WEBHOOK_URL` optionally forwards approved first-party analytics events.
- Set `SITE_URL` to the published production URL when preparing the site for launch.