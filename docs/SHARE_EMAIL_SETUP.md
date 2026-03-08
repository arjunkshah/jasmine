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

Use a subdomain like `share@` or `noreply@` to isolate sending reputation.

## 4. Redeploy

After adding env vars, redeploy your Vercel project so the new values take effect.
