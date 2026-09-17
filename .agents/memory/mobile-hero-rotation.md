---
name: Mobile hero rotation
description: Constraints for the homepage rotating hero on narrow screens.
---

On mobile, the homepage hero must size itself from the active slide after the active class has been applied; hidden slide positioning must not constrain the active slide.

**Why:** Fixed reserved heights and animated height changes caused CTA buttons or the lower half of a new headline to be clipped during automatic rotation.

**How to apply:** Keep the active slide in normal flow on responsive layouts, reset inherited inset positioning, measure after the class swap with a requestAnimationFrame, and avoid mobile crossfades that visually overlap different headlines.