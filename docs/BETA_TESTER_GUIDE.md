# Helper Hub — Beta Tester Guide

Thanks for helping us test! This guide walks you through setting up and using the app. No technical background needed.

**App URL:** [https://helper-comparison.vercel.app](https://helper-comparison.vercel.app)

---

## 1. What this app does

**Helper Hub** pulls applicants from your HelperPlace employer account, scores and ranks them against your hiring preferences, and gives you one place to review profiles, message candidates on WhatsApp, schedule interviews, and track your pipeline. It does not apply to jobs or message anyone automatically — you stay in control of every outreach and decision.

---

## 2. Sign up

1. Open **[https://helper-comparison.vercel.app/sign-up](https://helper-comparison.vercel.app/sign-up)**.
2. Create an account with **Google** or **email + password**.
3. After sign-up you land in the app. Your data is private to your account — other testers cannot see your candidates.

---

## 3. Connect HelperPlace (critical)

You need this step before applicants will appear. The app imports from **your** HelperPlace employer account, not the public helper directory.

### Before you start

- You must have a **HelperPlace employer account** (the account you use to post jobs and review applicants).
- You need an **active job posting** with applicants (or applicants who have applied to your job).
- Your HelperPlace **email and password must work** at [helperplace.com/login](https://www.helperplace.com/login).

### Steps

1. In the app sidebar, open **HelperPlace** (the key icon). On mobile, tap the **hamburger menu** (☰) at the top and choose **HelperPlace**.
2. Fill in:
   - **HelperPlace email** — same as your employer login.
   - **Password** — must log in successfully on helperplace.com. It is encrypted and stored securely; the app never shows it again after saving.
   - **Applicants page URL** — see below (this is the most common setup mistake).
3. Turn on **Enable daily automatic scrape**.
4. Tap **Save credentials**.

### How to get the correct Applicants URL

1. Log in to HelperPlace in your browser as an **employer**.
2. Open **your job’s applicants list** — the page that lists people who applied to **your** posting (not the public “find helper” browse page).
3. Copy the full URL from your browser’s address bar.
4. Paste it into the **Applicants page URL** field.

**The URL must contain `/applicant`** in the path.

| ✅ Good example | `https://www.helperplace.com/find-candidate-singapore/applicant` |
| ❌ Wrong | `https://www.helperplace.com/find-candidate` (public catalog, not your applicants) |

If the URL is wrong, you may see strangers’ profiles or an empty inbox.

### Daily import schedule

- After you save credentials with daily scrape enabled, applicants are imported **automatically every day at about 8:00am Singapore time**.
- The **Last scrape** time appears on the HelperPlace settings page after a successful run.
- Need applicants sooner? Ask the admin to trigger a **manual scrape** for your account.

---

## 4. Set your preferences

Open **Preferences** in the sidebar to tell the app what you’re looking for. These settings are yours alone and affect how candidates are filtered and scored.

### Target start date

Set **Preferred helper start date** — when you need someone to start. This powers the availability filter and bonus points for helpers who can start soon.

### Hard filters

Hard filters are **on/off switches**. When a filter is **on**, candidates who don’t meet it are marked as failing hard filters (they stay in the app but you can filter them out). Turn a filter **off** if you don’t want that requirement.

| Filter | What it means (plain English) |
|--------|-------------------------------|
| **Reference letter required** | Must have at least one reference letter on their profile. |
| **Available by [your target date]** | Must be available on or before the start date you set above. |
| **Finished contract or in Singapore** | Must have completed a previous contract **or** already be in Singapore. |
| **English required** | Must list English as a spoken language. |
| **Must appear in recent work** | Selected skills must show up in duties for their **most recent or second-most recent job** — not just in the general skills list. |

For **Must appear in recent work**:

1. Turn the checkbox **on**.
2. Pick suggested tags (Baby Care, Child Care, Cooking, Elderly Care) or type your own (e.g. “Pet Care”) and click **Add**.
3. Every selected item must appear in recent job duties.

Review people who fail filters via Inbox → filter **Fails hard filters**.

### Desired skills

Enter a comma-separated list (e.g. `cooking, childcare, elderly care`). These add **ranking points** when matched — they don’t remove anyone from your inbox. Baby Care and Child Care matches are checked against **recent work history**, not only the skills section.

### Ranking weights (optional)

The **Ranking weights** section lets you fine-tune how points are calculated — reference letters, desired skills, years of experience, start-date bonuses, and more. Defaults work well for most people; adjust only if you want to prioritize something differently.

### Save

Click **Save preferences** when you change anything. Scores and filter results **recalculate automatically** after saving.

---

## 5. Using the app

### Inbox

**Inbox** is your main candidate list, sorted by score by default. You can:

- **Search** by name.
- **Filter** by pipeline stage, for example:
  - **All** — everyone active in your inbox
  - **New / unreviewed** — not yet reviewed
  - **Shortlisted** — you marked them as promising
  - **Passes hard filters** / **Fails hard filters**
  - **No WhatsApp phone** — missing a usable phone number
  - **Messaged** / **Replied (WhatsApp)**
  - **Interview scheduled** / **Interviewing** / **Hired**
- **Sort** by score, date, or start date (column headers in the table).

Click a row to open the **candidate detail** page.

### Candidate detail page

Work history is the most important section — read **duties** for each job (newest first) to see what they actually did, not just what they claim in skills.

The page also shows:

- **Score** and whether they pass your hard filters
- **Availability**, contact info, reference letters
- **Work history** (with reference-letter indicators per job)
- Skills, languages, and about text
- **WhatsApp outreach** — compose a message and open WhatsApp (see below)
- **Interview** scheduling
- **Private notes** — only you can see these

Use **View on HelperPlace** to open their full profile on HelperPlace.

### WhatsApp outreach (manual)

The app **does not send messages for you**. It opens WhatsApp with a pre-filled message; you send it there.

1. On a candidate’s profile (or the **Outreach** page for batch messaging), pick a message template.
2. Click **Open WhatsApp** — your phone or WhatsApp Web opens.
3. Send the message yourself.
4. Back in the app, mark **Sent** or **Replied** so you can track who you’ve contacted.

**Outreach** in the sidebar focuses on shortlisted helpers with valid phone numbers.

### Interview scheduling

On a candidate’s profile, scroll to **Interview**:

1. Choose date/time, type (phone, video, or in person), and optional location or video link.
2. Save — status updates to **Interview scheduled**.
3. Use **Add to Google Calendar** if you want a calendar event.

Upcoming interviews also appear on the **Today** page.

### Rejecting a candidate

On the candidate detail page, change **Status** to **Rejected**. Rejected candidates are **removed from your Inbox** (they are not deleted — you can still find them if you change status again from a direct link, but normally they leave the active list).

Other useful statuses: **Shortlisted**, **Messaged**, **Interviewing**, **Hired**.

---

## 6. Tips & troubleshooting

| Problem | What to try |
|---------|-------------|
| **Empty inbox** | Connect HelperPlace first (HelperPlace page → save credentials). Wait for the next daily import (~8am SGT) or ask admin for a manual scrape. |
| **Wrong applicants showing** | Check your **Applicants page URL** — it must be your job’s applicant list and include `/applicant`, not `/find-candidate`. |
| **No new applicants after a day** | Confirm daily scrape is enabled and password still works on helperplace.com. Check **Last scrape** on the HelperPlace page. |
| **Scores all look similar** | Scores are **capped at 100** — a high scorer may hit the ceiling. Tweak ranking weights in Preferences if you want more spread. |
| **Sign out on mobile** | Tap the **hamburger menu** (☰) at the top → **Sign out** at the bottom of the menu. |
| **Can’t message on WhatsApp** | Filter Inbox by **No WhatsApp phone** — some profiles lack a valid number. |
| **Filter seems too strict** | Open **Preferences** and turn off or relax hard filters, then save. |

### Beta limitations

- We’re on a **small beta group** — please share feedback with us directly.
- Sign-in uses a **development auth setup** — occasional sign-in quirks may happen; try signing out and back in.
- Features and scoring rules may change as we improve the app.

---

## 7. What NOT to share

- **Do not share your HelperPlace password** with anyone — not even other testers. Each person should use their **own** HelperPlace employer account and their **own** Helper Hub login.
- **Do not share** links to your private candidate notes or screenshots with identifying helper details outside your hiring process.
- If you stop testing, you can remove saved credentials from the HelperPlace page (contact admin if you want your account data deleted).

---

## Quick checklist

- [ ] Signed up at [helper-comparison.vercel.app/sign-up](https://helper-comparison.vercel.app/sign-up)
- [ ] Connected HelperPlace with correct applicants URL (`/applicant`)
- [ ] Enabled daily scrape and saved
- [ ] Set target start date and preferences, then saved
- [ ] Reviewed Inbox after first import
- [ ] Shortlisted promising candidates and tried WhatsApp outreach

Questions or bugs? Reply to whoever invited you to the beta — we’re grateful for your help.
