# ParCare: quality checks

What a reviewer is likely to check, how we checked it, and how to run it again. Commands are for
Windows Command Prompt in the project folder. Last full run: 17 Nov 2026 (P-038).

| Area | Check | Result | How to run |
|---|---|---|---|
| Code quality | Lint (ESLint) | Clean | `npm run lint` |
| | Type check (TypeScript) | Clean | `npm run typecheck` |
| | Production build | Builds | `npm run build` |
| Tests | Unit tests (Vitest) | 269 passed | `npm test` |
| | End-to-end tests (Playwright, Pixel 7, both apps) | 63 passed | `npm run e2e` (stop `npm run dev` first) |
| Accessibility | axe-core scan of 19 screens, WCAG 2.1 A/AA | No serious or critical problems | `npx playwright test tests/e2e/a11y.spec.ts` |
| | Lighthouse (live start screen and terms, mobile) | Accessibility 100 · Best Practices 100 · SEO 100 | Chrome DevTools → Lighthouse, or https://pagespeed.web.dev |
| Performance | Lighthouse loading times (live, mobile) | First content ~1.2 s · main content ~2.5 s · no layout shift | https://pagespeed.web.dev (measure there: on our test laptop even example.com scored 68, so the local "Performance" number reflects the laptop, not the site) |
| Security | Known vulnerabilities in packages | 0 (`npm audit --omit=dev`) | `npm audit --omit=dev` |
| | Secrets in code or git history | None; only `.env.example` (no real values) is in git | `git ls-files` · keys live in `.env.local` and Vercel only |
| | HTTPS | HTTP redirects to HTTPS; HSTS on | open `http://parcare-six.vercel.app` |
| | Security headers | X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy (no camera, no location, microphone only on ParCare); no X-Powered-By | `curl -I https://parcare-six.vercel.app/` |
| | Scheduler endpoint | Refuses calls without the secret (401) | `curl -X POST https://parcare-six.vercel.app/api/tick` |
| | Data access | Row-level security: a child sees only their own family; the parent app reads only her household on the server | `supabase/migrations/0001_init.sql`, `src/data/parent-access.ts` |
| AI | Day reader evaluation (fictional days) | Precision 100%, recall 100% (36 items) | `npm run ai:eval` |
| Guardrails | No WhatsApp name or logo in the app | None | search `messages/en.json` |
| | No phone calls (`tel:` links) | None | search `src` |
| | Missed check-in never says "emergency" | Checked by unit and e2e tests | `tests/e2e/alarm.spec.ts` |
| | Consent first, parent controls sharing, no diagnosis, 30-day keeping period | Unit + e2e tests | `tests/unit`, `tests/e2e` |
| | Only made-up data | Sample family is fictional (Priya, Kamla "Maa", Mrs. Verma) | `src/data/seed.ts` |
| Installable app | Web app manifest + service worker | Installs to the home screen (Android Chrome, iPhone Safari) | `/manifest.webmanifest` |

## Known limits (stated in the app and the terms)

- A web app cannot ring while it is fully closed; it shows a phone notification instead.
- iPhone: notifications work only from the home-screen icon.
- ParCare is not an emergency or medical service and never places calls.
- Lighthouse "Performance" depends on the computer running it; run it with nothing else busy.
