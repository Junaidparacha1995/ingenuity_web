---
name: Visual design source
description: The approved visual language and the cursor-safety exception that future website styling must preserve.
---

Use the Ingenuity Systems liquid-glass design system as the visual source of truth: Manrope headings, Inter body copy, navy/orange palette, shared glass surfaces, rounded geometry, and restrained motion.

**Why:** The user explicitly designated the supplied liquid-glass stylesheet as the consistency standard. Its original custom-cursor section conflicts with a previously resolved invisible-cursor bug.

**How to apply:** Build new visual work from the shared tokens and component language already represented in the active CSS stack. Preserve native cursors and appropriate pointer, text, and grab affordances; do not copy cursor-hiding rules from the supplied source.

Full-width active mega-menu titles should keep the hover surface full-width but render the active underline with text decoration so it follows the label text.

**Why:** A pseudo-element positioned across a full-width active link expands the underline to the entire menu card instead of matching the original label-only treatment.

**How to apply:** Use the full-width title link for the hover background and `text-decoration` for its active underline; do not use a right/left-stretched active-link pseudo-element.

Connected-system diagrams should keep only the supplied nodes and connection lines. Do not add baked-in backgrounds, decorative badges, ambient particles, or visible click-area overlays.

**Why:** The user explicitly asked for the Home system map to remain visually clean and for node hit areas to provide interaction without adding new artwork.

**How to apply:** Keep clickable regions transparent and let clicks update the existing detail UI rather than introducing additional map decoration or selection chrome.