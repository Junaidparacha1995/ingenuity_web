---
name: Below-fold preview captures
description: A preview-tool limitation affecting screenshot verification of lazy-rendered sections below the initial viewport.
---

Do not treat a blank fragment-target screenshot as proof that a below-the-fold section is absent when the page uses content visibility or intrinsic-size containment.

**Why:** The preview screenshot tool can jump before lazy layout has settled and capture empty space even when the section is present, eagerly rendered during normal scrolling, and fully represented in the served DOM.

**How to apply:** Verify below-the-fold work through normal page scrolling when available, then combine that visual check with served-DOM assertions, asset/version checks, and browser-console review.