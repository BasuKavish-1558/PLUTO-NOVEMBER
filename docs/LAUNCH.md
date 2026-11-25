# Launching Pluto for other users

A checklist for going from "works for me" to "strangers can sign up". Most of it is dashboard settings. The code is ready.

## Current setup: a friends test (up to 10 people, free plan)

Decided Nov 25: **Confirm email stays off, no custom SMTP, no Pro plan.** That's fine at this scale, with three consequences:

- **No emails reach friends.** Supabase's built-in mailer only delivers to your own team's addresses, so "Forgot password?" won't work for them. If someone forgets their password, you reset it for them: Dashboard → Authentication → Users → the user → set a new password, or delete the user so they can sign up again. Adding SMTP later (Resend's or Brevo's free tiers are enough) makes forgot-password work for everyone, with no code change.
- **The free project pauses after 7 days with no activity.** If nobody opens the app for a week, restore it from the dashboard. Data is kept, but there are no automatic backups on the free plan.
- **Free limits are far above 10 users:** 500 MB database, 1 GB file storage, 50,000 monthly users.

You still need sections 1 (migrations and the `delete-account` function) and 2 (hosting, so your friends have a link). Skip the Confirm email, SMTP and Pro rows until a real launch.

## 1. Supabase project

Run these from the project folder:

```
npx supabase db push --remote                     # all pending migrations
npx supabase functions deploy delete-account     # account deletion (P-5)
npm run db:types                                  # refresh src/types/database.ts, then: npm run typecheck
```

If a migration and the app ever disagree about a table's columns, `npm run typecheck` fails (`src/data/schemaDrift.ts`).

In the dashboard:

| Where | Setting | Why |
|---|---|---|
| **Authentication → Sign In / Providers → Email** | **Confirm email: on** | Stops throwaway or mistyped sign-ups. The app already shows "check your inbox", and the link signs the user straight in. |
| same | Minimum password length: **8** | Matches the app's own check. |
| same | Secure password change: on (optional) | Compatible: Change password re-authenticates right before updating. |
| **Authentication → URL Configuration** | **Site URL** = `https://your-domain` | Where confirmation links land. |
| same | **Redirect URLs**: `https://your-domain/reset-password` and `https://your-domain/**` (plus `http://localhost:5173/**` for development) | Password-reset and confirmation links are refused unless listed. |
| **Authentication → Emails → SMTP Settings** | **Custom SMTP: required** (Resend, Postmark, Amazon SES, Brevo…). Sender "Pluto". | Supabase's built-in mailer only sends to your own team's addresses, at a few emails an hour. Without this, real users never receive reset or confirmation emails. |
| **Authentication → Emails → Templates** | Reword "Confirm signup" and "Reset password" in Pluto's voice | First impression. |
| **Authentication → Rate Limits / Attack Protection** | Keep the defaults. Consider CAPTCHA (Cloudflare Turnstile) if bots appear. | CAPTCHA would need a small code change in the sign-up form (not built). |
| **Project Settings → Billing** | **Pro plan** before inviting people | The free tier pauses after a week without activity and has no daily backups. |
| **Advisors → Security / Performance** | Run both. Expect no warnings. | RLS, function search paths and indexes were reviewed (see PLAN.md). |
| **Database → Extensions** | `pg_cron` enabled (the migration does it) | Nightly cleanup of sync tombstones older than 90 days. |

The anon key in the app is public by design: row-level security is what protects each user's data. Never ship the service-role key; only the `delete-account` function uses it, on the server.

## 2. Hosting (any static host with HTTPS)

| | Vercel | Netlify | Cloudflare Pages |
|---|---|---|---|
| Build command | `npm run build` | `npm run build` | `npm run build` |
| Output folder | `dist` | `dist` | `dist` |
| Routing and headers | `vercel.json` (included) | `public/_redirects`, `public/_headers` (included) | same as Netlify |

Environment variables (Production): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. They're baked in at build time, so redeploy after changing them.

What the configs give you:
- Every route serves the app.
- `/assets/*` is cached forever (the filenames are content-hashed).
- `sw.js` is never cached, so updates reach users.
- Standard security headers.

The Content-Security-Policy itself is a `<meta>` tag added at build time (`csp.ts`), so it works on any host. If you move Supabase to a custom domain, rebuild with the new `VITE_SUPABASE_URL` and the policy follows.

Use a custom domain with HTTPS: installing the PWA and camera access both require a secure origin.

## 3. Before you invite people

- [ ] Sign up with a fresh email on the deployed site: confirm the email, go through onboarding, log a workout, then reset your password from a second device.
- [ ] Install on iPhone (Safari → Share → Add to Home Screen) and Android (Chrome → Install). Open it in airplane mode.
- [ ] `npm run test:perf` and `npm run audit` (Lighthouse) against the deployed build.
- [ ] A short privacy policy and contact address: you store body weight, photos and email. Delete account removes everything (rows, photos, login).
- [ ] Decide who can sign up. Today anyone with the link can. Supabase can turn sign-ups off if you want an invite-only start.

## 4. Running it

- **Supabase → Logs:** auth and edge function errors.
- **User feedback:** Profile shows "changes couldn't be saved" when the server rejects something, so ask users to report what it says.
- **Backups:** daily on Pro. Point-in-time recovery is an add-on.
- **Updates:** `npm outdated` monthly. Re-run the full checks (`typecheck`, `lint`, `test`, `build`, `test:e2e`) before deploying.
