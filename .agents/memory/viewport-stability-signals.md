---
name: Viewport stability signals
description: Distinguishing real resize and zoom changes from mobile browser chrome and keyboard viewport changes.
---

Treat width, zoom scale, and orientation changes as responsive resize signals. On mobile, do not treat height-only visual viewport changes as resize or zoom because browser toolbars and the on-screen keyboard emit them during ordinary use.

**Why:** A site-wide resize state tied to every visual viewport event can pause or snap transitions while the user scrolls or types. Gradual pinch zoom can also be missed if the comparison baseline advances after every sub-threshold event.

**How to apply:** Compare against the last accepted width and scale so small pinch increments accumulate into one meaningful resize lifecycle. Advance that baseline only after accepting a change, debounce the end event, and resume each animation loop once.