---
name: Case-study card layout
description: The sizing rule that keeps case-study cards and their action rows separated across breakpoints.
---

Case-study cards should use content-driven height at every breakpoint; the shared Work-card `height: 100%` rule is not safe for wrapped case-study content.

**Why:** On narrow screens, inherited percentage height can crowd or clip the flow chips, action button, or expanded detail when text wraps differently.

**How to apply:** Scope `height: auto` and natural grid rows to `.case-study-page` while retaining the desktop two-column grid and using a mobile gap between stacked cards.