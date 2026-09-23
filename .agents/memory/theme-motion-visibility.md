---
name: Theme motion visibility
description: Why theme-switch motion must be tested mid-animation on both dark and light surfaces.
---

The site's hero is already navy in light mode. Merely changing the theme at click time and moving a translucent decoration across it looks like no animation, even if the decoration is technically animated. The user repeatedly rejected narrow light bands and full-screen obscuring overlays.

**Why:** A convincing transition needs the outgoing and incoming page states visible together during the change. Static before/after screenshots cannot establish that this works.

**How to apply:** Keep content visible, make the actual palette change spatially progressive, and inspect browser captures while the toggle animation is in progress. Check a route with a light below-hero surface as well as the dark home hero; test both directions and the small-screen toggle.