# Ingenuity Systems — zoom stability update

Release: `20260918-zoom1`

This package was built from your uploaded `ingenuity-systems-project.zip`.
It preserves the site's content, branding, images, routes, forms and server API
logic. It is a complete project, not a CSS-only patch.

## What was causing instability

- The old viewport handler treated every pinch-scale change as a layout resize.
  Its global `transition: none` rule cancelled in-progress UI transitions, and
  resize-completion events repeatedly remeasured components.
- The ambient canvas reassigned its width and height even when unchanged. These
  assignments clear the bitmap. A new frame was deferred until a later callback.
- Large fixed blurred backgrounds continuously changed both shape and position.
  Work heroes also scaled a large image behind text.
- Work tabs briefly displayed both panels. Quick clicks could leave a stale timer
  that hid the selected panel and changed the document height unexpectedly.
- Mobile Home headlines auto-rotated while only the active headline determined
  the hero's height. Different-length text moved the sections below it.
- Projects terminals changed text every 6–12 milliseconds. Touch cards also used
  3D backfaces, and carousel touch handlers mistook two-finger gestures for swipes.
- Work/Case Studies and Services included repeated forced scroll corrections.
- Touch chatbot opening forced input focus, immediately opening the keyboard.

These are code-level findings and regression-test results, not a physical-device
GPU profile. There may still be device/browser-specific rendering behavior.

## Changes

- Separate layout resizing from pinch zoom. Ignore mobile keyboard/address-bar
  height-only changes for layout reinitialization; debounce real layout changes.
- Pause decorative motion during zoom or while the document is hidden, without
  cancelling UI transitions. Pause supported decorative sections off-screen.
- Resize canvas backing buffers only when dimensions actually change and paint
  immediately. Retain the scene and animation phase; do not restart off-screen.
- Keep the coloured background treatment but freeze expensive full-page blob
  morphing and Work hero image scaling. Reduce unnecessary touch-device filters.
- Stabilize header mode changes near the scroll threshold.
- Make mobile/tablet Home headlines manually controlled through their existing
  dots. Keep desktop autoplay and reserve natural space for its longest slide.
- Make Projects panels natural-height. Reserve terminal line wrapping before
  typing, update desktop traces at a lower frequency, and show compact traces
  without character-by-character typing. Preserve filtering and one-open-card behavior.
- Switch Work panels atomically. Remove repeated forced-scroll resets.
- Use a flat tap-to-reveal treatment for touch flip cards; preserve desktop flips.
- Keep pinch gestures from selecting carousel slides or dragging marquees.
- Keep the assistant's existing placement and branding. Do not force the mobile
  keyboard open when launching it.
- Version all changed shared CSS/JS references across the 22 pages. Unversioned
  CSS/JS now revalidates instead of being cached as immutable for a year.

## Deploy to Replit

1. Keep a backup/snapshot of your current Replit project.
2. Extract this ZIP and upload its **contents into the existing project root**,
   replacing matching files and keeping the `assets`, `pages`, `projects`, and
   `case-studies` directories in place. Do not nest the whole project in another
   directory or upload only the stylesheet.
3. Keep your existing Replit Secrets. No provider keys or webhook credentials
   have been added to this ZIP, and no API integration was changed.
4. Restart with `python3 server.py` (the included run/deployment configuration
   already uses this command). The app reads Replit's `PORT`, defaulting to 5000.
5. Republish the deployment. Restarting the workspace alone does not update an
   already published deployment.
6. Open the published site in a fresh tab or refresh once. In the page source,
   `styles.css`, `responsive-v19.css`, and `script.js` should reference
   `?v=20260918-zoom1`. `orange-ambient.js` uses the same tag where included.

The ZIP has application files directly at its root and includes every original
runtime asset. Test dependencies are optional and are not needed to serve the site.

## Checks completed here

- 11 automated DOM/scheduler regression groups pass.
- All 22 HTML pages initialize at simulated widths 320, 768 and 1440, with no
  script errors in the test harness.
- Projects interactions additionally tested at 320, 360, 390, 430, 768, 820,
  1024, 1280 and 1440: filtering, single-card expansion, cancellation, traces,
  and absence of forced scrolling.
- Pinch-scale sequences do not emit layout-resize events or close open cards.
- Actual HTTP checks: 22 routes, 70 local resource URLs, gzip and cache headers.
- CSS parses and local JavaScript syntax checks pass.
- Tests do not submit forms, contact AI providers, send webhooks or book meetings.

To rerun the optional checks:

```sh
python3 tests/check_routes.py
npm ci --prefix tests
npm test --prefix tests
```

## Visual verification still required

The preview browser available during this task could not access the local app.
DOM tests do not render pixels: no claim is made of verified Safari rendering,
measured frame rate, horizontal-overflow measurements or physical-device pinch tests.

After republishing, check these on the actual site:

- iPhone Safari and Android Chrome: pinch in/out on Projects with a card open,
  pan while zoomed, return to normal, rotate the device, and open/close chat.
- Tablet: portrait/landscape, navigation, touch cards and the Work tab switcher.
- Desktop Chrome/Safari: 80%, 100%, 125%, 150% and 200% browser zoom, including
  while the header is near its scroll-mode boundary.
- Home: no automatic mobile headline changes; desktop dots and autoplay still
  work; the existing desktop SVG and its clickable overlay are unchanged.
- Services: capability links land once, then allow free scrolling. Contact and
  chatbot provider responses should be checked with your existing Replit Secrets.

If flicker remains, record the page URL, device/browser, zoom level, and whether
it affects a particular card, the header, or the entire screen. A short recording
will distinguish remaining browser painting issues from layout changes.

Technical references used when checking the resize behavior:
[VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
and [canvas width resets](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/width).
