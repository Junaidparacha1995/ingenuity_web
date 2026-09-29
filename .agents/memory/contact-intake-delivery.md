---
name: Contact intake delivery
description: Delivery expectations when the contact form fans out to Make and a private or tunneled intake app.
---

When Make accepts a contact submission but the private intake endpoint fails, treat the inquiry as partially received rather than a total failure. Tell the visitor the team has the inquiry, the intake app did not receive it, and not to resubmit. Never claim the intake app received data unless its request succeeded.

**Why:** Replit cannot reach a local-only endpoint when its tunnel or local service is offline. Returning a total failure after Make already accepted the submission encourages retries that can create duplicate Make records; claiming full success would hide the missing intake copy.

**How to apply:** Keep separate delivery statuses for Make and the intake app. If the user needs the local app to receive submissions, require a reachable HTTPS tunnel and clearly state that the app/tunnel must remain active. Do not send another live test unless the user asks.