# V5 Visual + Projects Upgrade

## Image strategy
The site no longer treats every visual as the same dark dashboard illustration.

The new mixed-media system uses:
- curated editorial photography for industries, people, About, and Careers
- custom product-interface SVG art for AI, Automation, Software, Integration, Services, and Industries
- category-specific color grading and system labels on industry cards
- local branded SVG fallbacks if remote editorial photography is unavailable

## Projects experience
The Recent Projects page now behaves as an interactive engineering portfolio:
- click a project card or `Explore project`
- the project expands into a full-width dossier
- engineering brief and implementation notes slide down
- a project-specific terminal trace types itself into the expanded panel
- only one project dossier is open at a time
- homepage project links deep-link directly to the correct expanded project
- main portfolio terminal supports `open <slug>` to expand and `repo <slug>` to open GitHub

## Validation
- 29 HTML pages
- no missing local references
- no duplicate HTML IDs
- JavaScript syntax checks pass
- CSS brace balance passes
- RAG knowledge base rebuilt from all 29 pages
