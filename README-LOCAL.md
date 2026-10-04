# Ingenuity Systems — local website package

## Run it

Requirements: Python 3.10 or newer. No pip packages are required.

- macOS/Linux: `python3 server.py`
- Windows: `py server.py`

Then open http://127.0.0.1:5000. Stop the server with Ctrl+C.
If port 5000 is occupied, set `PORT` to another port before starting the server.
The site starts in light mode; use the header toggle to switch to dark mode and back.

## Optional integrations

The website runs without Replit. Replit secrets are intentionally not included in this ZIP.
The assistant needs `OPENAI_API_KEY`. Contact-form delivery is handled by your external Make
scenarios and intake app; the site does not send email directly. To enable local contact
submissions, configure these environment variables in your terminal before starting the server:

- Primary Make router: `INGENUITY_ROUTER_WEBHOOK_URL` or `MAKE_WEBHOOK_URL`
- Second Make form webhook: `MAKE_SECOND_WEBHOOK_URL`
- Intake app endpoint: `APP_INTAKE_WEBHOOK_URL` (must be HTTPS)
- Optional assistant model: `OPENAI_CHAT_MODEL` (defaults to `gpt-4o-mini`)
- Optional Calendly webhook signature verification: `CALENDLY_WEBHOOK_SIGNING_KEY`

The actual confirmation and follow-up emails depend on the downstream Make scenarios being
configured and active. A successful website submission only confirms webhook acceptance; it
does not prove that an email reached an inbox.

## Safe local check

Run `python3 tests/check_routes.py` to check the local pages, assets, compression, and cache
headers. This test does not submit the contact form, call external APIs, or send emails.
