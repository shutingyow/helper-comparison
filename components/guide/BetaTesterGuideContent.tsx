import Link from "next/link";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="mb-4 border-b border-stone-200 pb-2 text-xl font-semibold text-stone-900">
        {title}
      </h2>
      <div className="space-y-4 text-stone-700">{children}</div>
    </section>
  );
}

function GuideTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 font-medium text-stone-900">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-stone-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-stone-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-jade-700 underline decoration-jade-200 underline-offset-2 hover:text-jade-800"
    >
      {children}
    </a>
  );
}

export function BetaTesterGuideContent() {
  return (
    <article className="prose-guide space-y-10">
      <header className="rounded-xl border border-jade-100 bg-jade-50/60 px-5 py-4">
        <p className="text-stone-700">
          Thanks for helping us test! This guide walks you through setting up and using the app. No
          technical background needed.
        </p>
        <p className="mt-2 text-sm text-stone-600">
          App URL:{" "}
          <ExternalLink href="https://helper-comparison.vercel.app">
            helper-comparison.vercel.app
          </ExternalLink>
        </p>
      </header>

      <nav className="rounded-lg border border-stone-200 bg-white p-4">
        <p className="mb-2 text-sm font-medium text-stone-900">On this page</p>
        <ol className="list-inside list-decimal space-y-1 text-sm text-jade-700">
          <li>
            <a href="#what-it-does" className="hover:underline">
              What this app does
            </a>
          </li>
          <li>
            <a href="#sign-up" className="hover:underline">
              Sign up
            </a>
          </li>
          <li>
            <a href="#helperplace" className="hover:underline">
              Connect HelperPlace
            </a>
          </li>
          <li>
            <a href="#preferences" className="hover:underline">
              Set your preferences
            </a>
          </li>
          <li>
            <a href="#using-the-app" className="hover:underline">
              Using the app
            </a>
          </li>
          <li>
            <a href="#troubleshooting" className="hover:underline">
              Tips &amp; troubleshooting
            </a>
          </li>
          <li>
            <a href="#privacy" className="hover:underline">
              What NOT to share
            </a>
          </li>
          <li>
            <a href="#checklist" className="hover:underline">
              Quick checklist
            </a>
          </li>
        </ol>
      </nav>

      <Section id="what-it-does" title="1. What this app does">
        <p>
          <strong>Helper Hub</strong> pulls applicants from your HelperPlace employer account, scores
          and ranks them against your hiring preferences, and gives you one place to review profiles,
          message candidates on WhatsApp, schedule interviews, and track your pipeline. It does not
          apply to jobs or message anyone automatically — you stay in control of every outreach and
          decision.
        </p>
      </Section>

      <Section id="sign-up" title="2. Sign up">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Open{" "}
            <Link
              href="/sign-up"
              className="font-medium text-jade-700 underline decoration-jade-200 underline-offset-2 hover:text-jade-800"
            >
              helper-comparison.vercel.app/sign-up
            </Link>
            .
          </li>
          <li>Create an account with <strong>Google</strong> or <strong>email + password</strong>.</li>
          <li>
            After sign-up you land in the app. Your data is private to your account — other testers
            cannot see your candidates.
          </li>
        </ol>
      </Section>

      <Section id="helperplace" title="3. Connect HelperPlace (critical)">
        <p>
          You need this step before applicants will appear. The app imports from{" "}
          <strong>your</strong> HelperPlace employer account, not the public helper directory.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Before you start</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            You must have a <strong>HelperPlace employer account</strong> (the account you use to
            post jobs and review applicants).
          </li>
          <li>
            You need an <strong>active job posting</strong> with applicants (or applicants who have
            applied to your job).
          </li>
          <li>
            Your HelperPlace <strong>email and password must work</strong> at{" "}
            <ExternalLink href="https://www.helperplace.com/login">helperplace.com/login</ExternalLink>
            .
          </li>
        </ul>

        <h3 className="mt-4 font-medium text-stone-900">Steps</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            In the app sidebar, open <strong>HelperPlace</strong> (the key icon). On mobile, tap the{" "}
            <strong>hamburger menu</strong> (☰) at the top and choose <strong>HelperPlace</strong>.
          </li>
          <li>
            Fill in:
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                <strong>HelperPlace email</strong> — same as your employer login.
              </li>
              <li>
                <strong>Password</strong> — must log in successfully on helperplace.com. It is
                encrypted and stored securely; the app never shows it again after saving.
              </li>
              <li>
                <strong>Applicants page URL</strong> — see below (this is the most common setup
                mistake).
              </li>
            </ul>
          </li>
          <li>
            Turn on <strong>Enable daily automatic scrape</strong>.
          </li>
          <li>
            Tap <strong>Save credentials</strong>.
          </li>
        </ol>

        <h3 className="mt-4 font-medium text-stone-900">How to get the correct Applicants URL</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Log in to HelperPlace in your browser as an <strong>employer</strong>.</li>
          <li>
            Open <strong>your job&apos;s applicants list</strong> — the page that lists people who
            applied to <strong>your</strong> posting (not the public &quot;find helper&quot; browse
            page).
          </li>
          <li>Copy the full URL from your browser&apos;s address bar.</li>
          <li>Paste it into the <strong>Applicants page URL</strong> field.</li>
        </ol>
        <p>
          <strong>The URL must contain </strong>
          <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm text-stone-800">/applicant</code>{" "}
          in the path.
        </p>

        <GuideTable
          headers={["", "Example"]}
          rows={[
            [
              "✅ Good",
              "https://www.helperplace.com/find-candidate-singapore/applicant",
            ],
            [
              "❌ Wrong",
              "https://www.helperplace.com/find-candidate (public catalog, not your applicants)",
            ],
          ]}
        />
        <p className="text-sm text-stone-600">
          If the URL is wrong, you may see strangers&apos; profiles or an empty inbox.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Daily import schedule</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            After you save credentials with daily scrape enabled, applicants are imported{" "}
            <strong>automatically every day at about 8:00am Singapore time</strong>.
          </li>
          <li>
            The <strong>Last scrape</strong> time appears on the HelperPlace settings page after a
            successful run.
          </li>
          <li>
            Need applicants sooner? Ask the admin to trigger a <strong>manual scrape</strong> for
            your account.
          </li>
        </ul>
      </Section>

      <Section id="preferences" title="4. Set your preferences">
        <p>
          Open <strong>Preferences</strong> in the sidebar to tell the app what you&apos;re looking
          for. These settings are yours alone and affect how candidates are filtered and scored.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Target start date</h3>
        <p>
          Set <strong>Preferred helper start date</strong> — when you need someone to start. This
          powers the availability filter and bonus points for helpers who can start soon.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Hard filters</h3>
        <p>
          Hard filters are <strong>on/off switches</strong>. When a filter is <strong>on</strong>,
          candidates who don&apos;t meet it are marked as failing hard filters (they stay in the app
          but you can filter them out). Turn a filter <strong>off</strong> if you don&apos;t want
          that requirement.
        </p>

        <GuideTable
          headers={["Filter", "What it means"]}
          rows={[
            [
              "Reference letter required",
              "Must have at least one reference letter on their profile.",
            ],
            [
              "Available by [your target date]",
              "Must be available on or before the start date you set above.",
            ],
            [
              "Finished contract or in Singapore",
              "Must have completed a previous contract or already be in Singapore.",
            ],
            ["English required", "Must list English as a spoken language."],
            [
              "Must appear in recent work",
              "Selected skills must show up in duties for their most recent or second-most recent job — not just in the general skills list.",
            ],
          ]}
        />

        <p>
          For <strong>Must appear in recent work</strong>: turn the checkbox on, pick suggested tags
          (Baby Care, Child Care, Cooking, Elderly Care) or type your own (e.g. &quot;Pet Care&quot;)
          and click <strong>Add</strong>. Every selected item must appear in recent job duties.
        </p>
        <p>
          Review people who fail filters via Inbox → filter <strong>Fails hard filters</strong>.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Desired skills</h3>
        <p>
          Enter a comma-separated list (e.g. <code className="rounded bg-stone-100 px-1.5 py-0.5 text-sm">cooking, childcare, elderly care</code>
          ). These add <strong>ranking points</strong> when matched — they don&apos;t remove anyone
          from your inbox. Baby Care and Child Care matches are checked against{" "}
          <strong>recent work history</strong>, not only the skills section.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Ranking weights (optional)</h3>
        <p>
          The <strong>Ranking weights</strong> section lets you fine-tune how points are calculated —
          reference letters, desired skills, years of experience, start-date bonuses, and more.
          Defaults work well for most people; adjust only if you want to prioritize something
          differently.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Save</h3>
        <p>
          Click <strong>Save preferences</strong> when you change anything. Scores and filter results{" "}
          <strong>recalculate automatically</strong> after saving.
        </p>
      </Section>

      <Section id="using-the-app" title="5. Using the app">
        <h3 className="font-medium text-stone-900">Inbox</h3>
        <p>
          <strong>Inbox</strong> is your main candidate list, sorted by score by default. You can:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Search</strong> by name.
          </li>
          <li>
            <strong>Filter</strong> by pipeline stage: All, New / unreviewed, Shortlisted, Passes /
            Fails hard filters, No WhatsApp phone, Messaged, Replied (WhatsApp), Interview scheduled,
            Interviewing, Hired.
          </li>
          <li>
            <strong>Sort</strong> by score, date, or start date (column headers in the table).
          </li>
        </ul>
        <p>Click a row to open the <strong>candidate detail</strong> page.</p>

        <h3 className="mt-4 font-medium text-stone-900">Candidate detail page</h3>
        <p>
          Work history is the most important section — read <strong>duties</strong> for each job
          (newest first) to see what they actually did, not just what they claim in skills.
        </p>
        <p>The page also shows score, availability, contact info, reference letters, work history,
          skills, languages, WhatsApp outreach, interview scheduling, and private notes. Use{" "}
          <strong>View on HelperPlace</strong> to open their full profile on HelperPlace.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">WhatsApp outreach (manual)</h3>
        <p>
          The app <strong>does not send messages for you</strong>. It opens WhatsApp with a
          pre-filled message; you send it there.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>On a candidate&apos;s profile (or the Outreach page), pick a message template.</li>
          <li>
            Click <strong>Open WhatsApp</strong> — your phone or WhatsApp Web opens.
          </li>
          <li>Send the message yourself.</li>
          <li>
            Back in the app, mark <strong>Sent</strong> or <strong>Replied</strong> so you can track
            who you&apos;ve contacted.
          </li>
        </ol>
        <p>
          <strong>Outreach</strong> in the sidebar focuses on shortlisted helpers with valid phone
          numbers.
        </p>

        <h3 className="mt-4 font-medium text-stone-900">Interview scheduling</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Choose date/time, type (phone, video, or in person), and optional location or video link.</li>
          <li>
            Save — status updates to <strong>Interview scheduled</strong>.
          </li>
          <li>Use <strong>Add to Google Calendar</strong> if you want a calendar event.</li>
        </ol>
        <p>Upcoming interviews also appear on the <strong>Today</strong> page.</p>

        <h3 className="mt-4 font-medium text-stone-900">Rejecting a candidate</h3>
        <p>
          On the candidate detail page, change <strong>Status</strong> to <strong>Rejected</strong>.
          Rejected candidates are removed from your Inbox. Other useful statuses: Shortlisted,
          Messaged, Interviewing, Hired.
        </p>
      </Section>

      <Section id="troubleshooting" title="6. Tips & troubleshooting">
        <GuideTable
          headers={["Problem", "What to try"]}
          rows={[
            [
              "Empty inbox",
              "Connect HelperPlace first (HelperPlace page → save credentials). Wait for the next daily import (~8am SGT) or ask admin for a manual scrape.",
            ],
            [
              "Wrong applicants showing",
              "Check your Applicants page URL — it must be your job's applicant list and include /applicant, not /find-candidate.",
            ],
            [
              "No new applicants after a day",
              "Confirm daily scrape is enabled and password still works on helperplace.com. Check Last scrape on the HelperPlace page.",
            ],
            [
              "Scores all look similar",
              "Scores are capped at 100 — a high scorer may hit the ceiling. Tweak ranking weights in Preferences if you want more spread.",
            ],
            [
              "Sign out on mobile",
              "Tap the hamburger menu (☰) at the top → Sign out at the bottom of the menu.",
            ],
            [
              "Can't message on WhatsApp",
              "Filter Inbox by No WhatsApp phone — some profiles lack a valid number.",
            ],
            [
              "Filter seems too strict",
              "Open Preferences and turn off or relax hard filters, then save.",
            ],
          ]}
        />

        <h3 className="mt-4 font-medium text-stone-900">Beta limitations</h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>We&apos;re on a <strong>small beta group</strong> — please share feedback with us directly.</li>
          <li>
            Sign-in uses a <strong>development auth setup</strong> — occasional sign-in quirks may
            happen; try signing out and back in.
          </li>
          <li>Features and scoring rules may change as we improve the app.</li>
        </ul>
      </Section>

      <Section id="privacy" title="7. What NOT to share">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Do not share your HelperPlace password</strong> with anyone — not even other
            testers. Each person should use their <strong>own</strong> HelperPlace employer account
            and their <strong>own</strong> Helper Hub login.
          </li>
          <li>
            <strong>Do not share</strong> links to your private candidate notes or screenshots with
            identifying helper details outside your hiring process.
          </li>
          <li>
            If you stop testing, you can remove saved credentials from the HelperPlace page (contact
            admin if you want your account data deleted).
          </li>
        </ul>
      </Section>

      <Section id="checklist" title="Quick checklist">
        <ul className="space-y-2">
          {[
            <>Signed up at <Link href="/sign-up" className="text-jade-700 hover:underline">helper-comparison.vercel.app/sign-up</Link></>,
            <>Connected HelperPlace with correct applicants URL (<code className="rounded bg-stone-100 px-1 text-sm">/applicant</code>)</>,
            <>Enabled daily scrape and saved</>,
            <>Set target start date and preferences, then saved</>,
            <>Reviewed Inbox after first import</>,
            <>Shortlisted promising candidates and tried WhatsApp outreach</>,
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-stone-300 bg-white text-xs text-stone-400">
                ☐
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-stone-600">
          Questions or bugs? Reply to whoever invited you to the beta — we&apos;re grateful for your
          help.
        </p>
      </Section>
    </article>
  );
}
