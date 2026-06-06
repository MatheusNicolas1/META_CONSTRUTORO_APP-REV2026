# Meta Construtor Design Context

## Register

Marketing pages use the brand register: the design must communicate trust, clarity and operational maturity. Product dashboards can remain utilitarian, but public pages must feel deliberate and findable.

## Current System

- Framework: React, Vite and Tailwind.
- Component style: shadcn/Radix-like primitives with local UI components.
- Primary brand color in CSS tokens: orange, `--primary: 14 100% 57%`.
- Light mode is the default app theme.
- Dark sections exist in landing components, but they must be used with restraint and strong contrast.
- Typography currently relies heavily on Inter. Future visual restructuring should consider a more distinctive display/body pairing or a more deliberate single-family system.

## Visual Direction

Recommended direction for public marketing:

- Color strategy: restrained with a committed orange accent.
- Theme scene: a construction company director or engineer reviews the platform during work hours on a laptop, in a bright office or jobsite trailer, needing clear decisions rather than atmosphere.
- Layout: structured, spacious and scannable; strong headings, concrete product screenshots and clear comparison sections.
- Voice: precise, operational and confident.

## Layout Rules

- Avoid card grids as the default page structure.
- Do not nest cards.
- Use full-width page bands and clear content groups.
- Keep body copy within 65ch to 75ch.
- Use one H1 per page and a logical H2/H3 outline.
- Keep CTAs stable and visible without overwhelming the page.

## Color Rules

- Use the orange primary color deliberately, mostly for CTAs, active states and important highlights.
- Do not use gradient text.
- Avoid purple/cyan AI-style palettes.
- Avoid glow-heavy dark sections unless they support a real product screenshot or workflow.
- Meet WCAG AA contrast in badges, buttons and colored panels.

## Motion Rules

- Prefer simple opacity/transform transitions.
- Avoid bounce or elastic motion.
- Do not animate height, width, padding or margin for common interactions.

## Content Rules

- Every public page needs a clear title, description, canonical, Open Graph tags and JSON-LD when useful.
- Avoid fake or unsupported claims.
- Blog and documentation pages must either become real indexable content or stay controlled until content is credible.
- Use product screenshots and real workflow proof where possible.

## Known Issues To Resolve

- Some public pages still use repeated icon tile cards.
- Some pages have heading hierarchy issues.
- Several URL-level Impeccable findings remain after the first technical SEO pass.
- `PRODUCT.md` and `DESIGN.md` were created after the initial PRD to give Impeccable a stable brand context for future visual work.
