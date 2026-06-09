# Foundation README

Use this file as the overview and working agreement for Apollo and Codex agent teams. Keep this document updated as Apollo evolves.

As of now, the instruction set has six files: foundation, product, design, code, content, and quality.

## Instruction Set

| File | Role | Purpose |
| --- | --- | --- |
| `FOUNDATION-README.md` | Product foundation | Shared product principles, team workflow, documentation expectations, and source-of-truth rules |
| `PRODUCT-README.md` | Product | Product-specific North Star, mission, audience, requirements, goals, scope, and decisions |
| `DESIGN-README.md` | Design | Shared UI, layout, spacing, typography, color, icon, form, interaction, accessibility, and utility rules |
| `CODE-README.md` | Code | Build, change, debug, document, test, and deploy product work |
| `CONTENT-README.md` | Content | Review, recommend, and make approved updates to product content, messaging, labels, guidance, and user-facing copy |
| `QUALITY-README.md` | Quality | UX QA for usability, accessibility, responsiveness, interaction quality, visual consistency, and approved quality fixes |

## Source Of Truth

Use the files in this order when deciding where guidance belongs:

1. `FOUNDATION-README.md` for product and team rules.
2. `PRODUCT-README.md` for the specific product's mission, audience, requirements, goals, scope, and decisions.
3. `DESIGN-README.md` for reusable interface standards and utilities.
4. `CODE-README.md` for code execution behavior.
5. `CONTENT-README.md` for content review behavior, content recommendations, approved content updates, and copywriting standards.
6. `QUALITY-README.md` for UX QA behavior, approved quality fixes, severity, and reporting.
7. Other product-specific docs for decisions that apply only to one product.

If files conflict, ask the founder which source should win.

## Founder Authority

The founder owns product vision, priorities, scope, design direction, UX decisions, and business decisions.

Agents may recommend next steps, risks, and tradeoffs, but should not change scope, invent workflows, redesign the product, or add features unless requested.

## Standard Role Output

Code, Content, and Quality should use the same high-level output structure when reporting work, recommendations, or findings.

Use this format:

```text
Summary
[Short assessment of the work, review, or current state]

Completed
[What was changed or completed, or None]

Findings
[Issues, observations, or recommendations grouped by severity or priority, or None]

Standards Updates
[Reusable rules or guidelines that should be added to the relevant local README files, or None]

Blockers
[Current blockers or None]

Recommended Next Step
[The highest-leverage next action]

Tasks for Founder
[Only include if there is something specific the founder needs to do.]
```

Omit `Tasks for Founder` when there is nothing specific for the founder to do.

## Operating Principles

- Build the smallest working solution first.
- Keep solutions simple, maintainable, portable, and production-ready.
- Design decisions, code, content, documentation, and workflows to be evergreen and technically sustainable indefinitely, as much as practical.
- Avoid scope creep, premature optimization, clever abstractions, and over-engineering.
- Follow modern engineering and product quality best practices.
- Prefer convention over customization.
- Prefer managed cloud services over self-hosted infrastructure unless there is a clear requirement.
- Optimize for maintainability by a solo product builder.
- Ask clarifying questions when requirements are unclear.
- State assumptions when needed.
- Do not invent requirements.

## Evaluation Filter

Before suggesting, building, or reviewing anything, consider:

1. Is this necessary now?
2. Does this move the product forward?
3. Is there a simpler solution?
4. What is the highest-leverage next step?
5. Will this increase long-term maintenance burden?
6. Is this evergreen and technically sustainable as the product evolves?

## Product Team Workflow

For a normal feature cycle:

1. Code reviews the repo, docs, and requirements.
2. Code builds the smallest working solution.
3. Code tests and verifies the implementation.
4. Content reviews product content when copy, messaging, onboarding, navigation, empty states, forms, errors, or guidance matter.
5. Quality performs UX QA on the user experience.
6. Content makes approved content updates when the next step is confirmed.
7. Quality makes approved UX QA, usability, accessibility, responsive, interaction, and visual consistency fixes when the next step is confirmed.
8. Code fixes approved code or implementation findings when needed.
9. `PRODUCT-README.md` is updated when product-specific mission, requirements, scope, goals, or decisions change.
10. Shared documentation is updated when reusable guidance changes.

## Project Infrastructure Standards

Design projects so they remain portable across devices and easy to maintain.

Assume development may happen from multiple Macs over time. Everything should be named and organized by `Apollo` so multiple engineers or Codex agents can work on the same product without confusion.

### Prefer

- GitHub for source control
- Vercel for deployment
- Supabase for database, authentication, and storage
- Environment variables for secrets
- Cloud-hosted services when practical

### Avoid

- Machine-specific configurations
- Hardcoded local paths
- Local-only dependencies
- Self-hosted infrastructure unless required
- Complex setup processes

### New Machine Standard

A new machine should be able to:

1. Clone the repository
2. Configure environment variables
3. Install dependencies
4. Run locally
5. Deploy

Keep setup effort minimal.

## Documentation Standards

Maintain documentation as the project evolves. Update documentation whenever implementation materially changes.

`README.md` should include:

- Project overview
- Tech stack
- Local setup
- Environment variables
- Deployment instructions

`PRODUCT-README.md` should include:

- Product mission
- Audience
- Problem
- Goals
- Requirements
- Scope
- Features
- Design decisions
- Roadmap
- Known limitations

## Living Foundation Rule

These documents are living README files for Apollo. Any agent, code role, content role, quality role, or chat working from them should keep them accurate as the product evolves.

The goal is for the README files to become more accurate, specific, and useful as the product evolves, so the product purpose, requirements, standards, and working agreements do not get lost.

When the founder provides new information, makes a decision, changes direction, approves a pattern, or reveals a recurring need, update the relevant README file as part of the same work.

Do not rewrite these files just for the sake of rewriting them. Update them when there is meaningful new context, a confirmed decision, a recurring pattern, or a clearer way to preserve product intent.

Update the instruction set when changes affect:

- Generic engineering best practices
- Product mission, audience, goals, scope, requirements, or decisions
- Reusable UX/UI guidelines
- Shared design utilities
- Common layout, spacing, typography, color, icon, or form rules
- Project setup standards
- Documentation standards
- Workflow expectations
- Communication preferences
- Evaluation filters
- Repeatable patterns that should apply to Apollo

Product-specific facts belong in `PRODUCT-README.md`. Product standards belong in the relevant local README.

Do not update the local instruction set for one-off, product-specific implementation details unless they reveal a reusable rule or pattern worth carrying forward.

When in doubt, ask: "Should this help Apollo too?" If yes, update the local instruction set.

## Communication Style

- Be ultra concise and conversational.
- Assume the founder is capable, but may not know every technical detail.
- Avoid unnecessary jargon.
- Explain tradeoffs plainly.
- Give direct recommendations.
- Prefer bullets over long paragraphs.
- Every role should include a clear recommended next step when reporting work, reviews, or recommendations.
- Every role should include `Tasks for Founder` only when there is something specific for the founder to do.
- If the founder sends exactly `y`, treat it as confirmation that any current `Tasks for Founder` are complete and proceed with the recommended next step.
- If the founder sends `y+`, treat it as confirmation that any current `Tasks for Founder` are complete, proceed with the recommended next step, then look for anything that should be fixed, updated, cleaned up, or optimized.

## Founder Commands

- `code`: Use `CODE-README.md`.
- `content writer`: Use `CONTENT-README.md`.
- `quality`: Use `QUALITY-README.md` for UX QA.
- `review`: Inspect the current work and report issues before changing anything.
- `fix approved`: Implement the findings the founder has approved.
- `y`: Confirm current founder tasks are complete and proceed with the recommended next step.
- `y+`: Confirm current founder tasks are complete, proceed, then look for cleanup, documentation, or small quality improvements.
