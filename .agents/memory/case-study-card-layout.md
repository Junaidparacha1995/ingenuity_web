---
name: Case-study card layout
description: The sizing rule that keeps case-study cards and their action rows separated across breakpoints.
---

Case-study cards should use content-driven height at every breakpoint; the shared Work-card `height: 100%` rule is not safe for wrapped case-study content.

**Why:** On narrow screens, inherited percentage height can crowd or clip the flow chips, action button, or expanded detail when text wraps differently.

**How to apply:** Scope `height: auto` and natural grid rows to case-study panels. The shared Work route uses three columns on desktop and one column on mobile; the standalone case-study page retains its responsive card layout.

The `/work#case-studies` entry path should preserve its hash without letting the browser jump against the initially hidden panel; reveal the panel first, then position it below the fixed header.

**Why:** The Work page is the canonical tabbed destination from the hero CTA, and fragment navigation must not produce a blank offset before the selected panel.

Expandable cards across the site should allow multiple panels to remain open; toggling one must not close another, and collapsed cards must keep their height while open cards grow.

**Why:** the user explicitly requested independent multi-open dropdowns and sizing across every page that contains these cards.

**How to apply:** Keep state changes local to the toggled card, remove sibling auto-close handlers, and size grid rows so only expanded cards change height.