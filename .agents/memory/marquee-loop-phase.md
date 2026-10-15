---
name: Marquee drag and loop phase
description: Why a looping logo strip must share one phase between autoplay and pointer dragging.
---

The technology strip must keep logos visible during pointer movement and continue seamlessly from its last logo back to its first. Dragging and autoplay must use the same normalized loop phase, not independent translations.

**Why:** A positive drag offset combined with a negative autoplay translation shifted the entire row outside its clipped viewport. A small left drag reproduced zero visible cards; resetting autoplay then introduced a blank interval. More duplicates and hover changes alone did not fix that composition error.

**How to apply:** Scrub the autoplay timeline for dragging, or normalize the combined final position before rendering. Verify actual browser geometry during left/right drags, pointer entry/exit, and immediately before and after the loop boundary. Resource requests and a static screenshot cannot establish seamless looping.
