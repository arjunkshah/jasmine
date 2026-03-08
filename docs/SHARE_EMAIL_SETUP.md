# Share Email Setup

When someone shares a project with you, you receive an email with a link. For this to work:

## 1. Add Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Create an API key in the dashboard
3. Add `RESEND_API_KEY` to your Vercel environment variables

## 2. Verify Your Domain (Required for real delivery)

**Important:** The default `onboarding@resend.dev` only delivers to the Resend account owner's email. Recipients will NOT receive emails until you use a verified domain.

1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g. `tryjasmine.dev`)
3. Add the DKIM and SPF DNS records to your domain
4. Wait for verification (usually a few minutes)

## 3. Set RESEND_FROM

Add to Vercel env vars:

```
RESEND_FROM=Jasmine <share@tryjasmine.dev>
```

Share links in invite emails use `https://tryjasmine.dev` by default. To override, set `JASMINE_APP_URL` in Vercel env vars.

Use a subdomain like `share@` or `noreply@` to isolate sending reputation.

## 4. Redeploy

After adding env vars, redeploy your Vercel project so the new values take effect.

## Troubleshooting: "I still don't get the emails"

1. **Using default sender** — If `RESEND_FROM` is not set, Resend uses `onboarding@resend.dev`, which **only delivers to the Resend account owner's email**. Other recipients will not receive anything. You must verify a domain and set `RESEND_FROM`.

2. **Local dev** — Add `RESEND_API_KEY` and `RESEND_FROM` to your `.env` file (not just Vercel). Restart the dev server after changing env vars.

3. **Spam folder** — Emails include Reply-To (sharer's address) and plain-text for better deliverability. Use a verified domain (RESEND_FROM); `onboarding@resend.dev` has poor reputation. New domains may land in spam until reputation builds—ensure SPF, DKIM, and DMARC are set.

4. **DNS propagation** — After adding DKIM/SPF records, wait 10–30 minutes. Resend shows verification status at resend.com/domains.

5. **Resend dashboard** — Check [resend.com/emails](https://resend.com/emails) for delivery status and any bounce/failure logs.
