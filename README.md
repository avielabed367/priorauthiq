# PriorAuthIQ

PriorAuthIQ is a fake-data demo for front-end denial-risk review.

The demo helps billing/admin teams review sample cases for eligibility, authorization, documentation, coding, coverage/network, and follow-up risks before they become denials, delays, or unpaid claims.

## Important demo warning

This project is currently a fake/sample-data demo only.

Do **not** enter real patient information, real insurance IDs, real medical record numbers, real clinic records, or protected health information.

PriorAuthIQ does **not** make final billing, medical, legal, or coverage decisions. Human review is required.

## Current product direction

PriorAuthIQ is focused on helping billing/admin teams catch upstream workflow issues earlier, including:

- Eligibility and benefits gaps
- Prior authorization uncertainty
- Missing plan of care, referral, or documentation
- Weak medical necessity support
- Coding risk
- Coverage or network risk
- Visit-limit uncertainty
- Front desk / provider follow-up gaps
- Unassigned workflow tasks

The goal is not to create another complicated dashboard.

The goal is to provide a simple review tool that shows:

1. What is risky
2. What is missing
3. Why it matters
4. Who may need to follow up
5. What should happen next
6. A draft follow-up message for human review

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth / Database
- OpenAI API
- PDF text extraction for sample/demo files

## Local setup

Install dependencies:

```bash
npm install