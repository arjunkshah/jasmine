# Cold Outreach Playbook — Jasmine (tryjasmine.vercel.app)

How to find **1000s** of people to reach out to — and focus on folks who **actually respond**.

---

## Who Responds (Target These)

- **1K–50K followers** — Big enough to care about tools, small enough to read DMs
- **Recently launched** — Actively looking for feedback and distribution
- **Posts "building in public"** — Used to sharing and engaging
- **Comments on IH, PH, Twitter** — Shows they engage, not just broadcast
- **Solo/small team** — No gatekeeper, founder reads the inbox

**Skip:** 100K+ followers, VCs, big-company execs. They get 1000s of cold emails.

---

## Sources for 1000s of Leads

### 1. Product Hunt Makers (10K+ people)

| Tool | What you get | Cost |
|------|--------------|------|
| [TexAu PH Makers Export](https://www.texau.com/automations/product-hunt/product-hunt-makers-search-export) | Name, role, product, profile links. Up to 3K makers per product. Export to CSV/Sheets. | Subscription |
| [Apify PH Scraper](https://apify.com/michael.g/product-hunt-scraper) | Products, team members, social links | Pay per run |
| [Apify PH + Emails](https://apify.com/fatihtahta/product-hunt-scraper-fast-reliable-4-1k) | Same + verified founder emails | ~$4 per 1K |

**Filter:** Products launched in last 90 days. Categories: Developer Tools, Design, Productivity. Makers with Twitter in profile.

---

### 2. Indie Maker Directories (1000s)

| Source | Size | Link |
|--------|------|------|
| **Indie Maker List** | 1000s, daily updated | [indiemakerlist.com](https://indiemakerlist.com/) |
| **Indie Hackers X Accounts** | Curated list, submit to get list | [indiehackerslist.com](https://indiehackerslist.com/) |
| **Ramen.Tools** | 2000+ makers, tools they use | [ramen.tools/explore/indie-hacker](https://ramen.tools/explore/indie-hacker) |
| **IndieLaunch directories** | 250+ directories to scrape | [indielaunch](https://www.indiehackers.com/product/indielaunch) |

---

### 3. Indie Hackers (High-Intent)

- **"Ship" / "Launched" posts** — People who just shipped, want feedback
- **"Seeking feedback"** — Explicitly asking for input
- **"Build in public" threads** — Swap Twitter handles, very engaged
- **Forum search:** `site:indiehackers.com launched` or `site:indiehackers.com seeking feedback`

Export: Manual copy, or use a scraper on IH forum pages. Hundreds of posts per month.

---

### 4. Twitter/X Lists & Search

| Approach | How |
|----------|-----|
| **Build in public lists** | Search "indie hackers Twitter list" — many public lists with 100–500 accounts |
| **Keyword search** | `"just launched" OR "shipped" OR "building in public"` — filter by last 7 days |
| **Follower extraction** | Use Phantombuster, Apify, or similar to get followers of @indiehackers, @ProductHunt, @levelsio (filter by 1K–50K followers) |
| **Tweet engagement** | People who reply to IH/PH launch tweets — they engage |

Tools: Phantombuster, Apify Twitter scrapers, Followerwonk, SparkToro.

---

### 5. Hacker News "Show HN"

- [hn.algolia.com](https://hn.algolia.com/) — Search `Show HN` + "website" or "landing" or "design"
- People who post Show HN want feedback. Often include contact in profile.
- Hundreds of posts per year. Most have emails in HN profile.

---

### 6. BetaList / Launching Next

- [betalist.com](https://betalist.com/) — Startups pre-launch
- [launchingnext.com](https://www.launchingnext.com/) — Upcoming launches
- Founders actively looking for early users. High response rate.

---

### 7. LinkedIn (If You Have Sales Nav)

- Search: "Founder" + "SaaS" or "Indie hacker" + "building"
- Filter: Company size 1–10, posted in last 30 days
- 1000s of results. Export to CSV, enrich emails with Hunter/Apollo.

---

### 8. Design / No-Code Communities

| Community | Size | Where to find people |
|-----------|------|----------------------|
| **Figma Community** | Huge | Creators who share templates, often have Twitter |
| **Webflow Community** | Large | Forum, showcase — people building sites |
| **Bubble** | Large | No-code builders, many indie |
| **r/SideProject** | 500K+ | Reddit — post or scrape "I built" threads |
| **r/Entrepreneur** | 3M+ | Same |
| **r/startups** | 1M+ | Same |

---

## Enrichment: Getting Emails

| Tool | Use case | Cost |
|------|-----------|------|
| **Hunter.io** | Domain → email (e.g. theirproduct.com) | Free tier: 25/mo |
| **Apollo.io** | LinkedIn + email, bulk search | Free tier |
| **RocketReach** | Name + company → email | Subscription |
| **Clearbit** | Enrich from domain | API |
| **Phantombuster** | Twitter profile → scrape bio/link for contact | Per automation |

**Fallback:** DM on Twitter. Many indie makers list "DM me" or have a Calendly. Response rate often higher than email for cold outreach.

---

## Suggested Volume

| Source | Est. leads | Response rate (typical) |
|--------|------------|--------------------------|
| PH makers (last 90 days) | 2,000–5,000 | 2–5% |
| Indie Maker List + Ramen | 2,000+ | 3–7% |
| IH "launched" / "feedback" | 500–1,000/mo | 5–10% |
| Twitter (build in public) | 5,000+ | 1–3% |
| HN Show HN | 200–500 | 5–15% |
| BetaList / Launching Next | 200–500 | 10–20% |

**Total addressable:** 10,000+ with a few hours of setup. Focus on IH, PH recent makers, and BetaList for highest response.

---

## Short Cold Email / DM Template

```
Subject: Quick feedback on Jasmine (AI design tool)

Hi [Name],

Saw you [launched X / posted about Y]. I built Jasmine (tryjasmine.vercel.app) — AI that generates full websites without the usual purple gradient slop.

Would love 2 min of feedback if you're open to it. No signup.

[Your name]
```

Keep it under 100 words. Personalize the first line.

---

## Priority Order

1. **BetaList / Launching Next** — Highest intent, smallest list
2. **IH "Seeking feedback" / "Just launched"** — Very engaged
3. **PH makers (last 30 days)** — Fresh launches
4. **Indie Maker List + Ramen** — Bulk, filter by relevance
5. **Twitter build-in-public** — Scale, lower response rate
