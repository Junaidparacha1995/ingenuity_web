---
name: Case-study card layout
description: The sizing rule that keeps case-study cards and their action rows separated across breakpoints.
---

Case-study cards should use content-driven height at every breakpoint; the shared Work-card `height: 100%` rule is not safe for wrapped case-study content.

**Why:** On narrow screens, inherited percentage height can crowd or clip the flow chips, action button, or expanded detail when text wraps differently.

**How to apply:** Scope `height: auto` and natural grid rows to case-study panels. The shared Work route uses three columns on desktop and one column on mobile; the standalone case-study page retains its responsive card layout.

The `/work#case-studies` entry path should preserve its hash without letting the browser jump against the initially hidden panel; reveal the panel first, then position it below the fixed header.

**Why:** The Work page is the canonical tabbed destination from the hero CTA, and fragment navigation must not produce a blank offset before the selected panel.

The homepage decision cards show all supporting detail by default and should remain equal-height; expandable project and case-study panels elsewhere allow multiple cards to stay open independently.

**Why:** the homepage cards no longer have Explore controls, while the user still expects independent expansion for project and case-study detail panels.

**How to apply:** Keep homepage decision-card details visible and equalize their heights across breakpoints. For expandable project and case-study panels, keep state changes local to each card, remove sibling auto-close handlers, and preserve collapsed heights while expanded cards grow. Apply cached collapsed heights immediately; do not clear and recalculate them after collapse animations.