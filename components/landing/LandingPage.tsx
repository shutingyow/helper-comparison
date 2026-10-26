import Link from "next/link";

const WHY_REASONS = [
  {
    title: "Find the perfect match for you",
    body: "Rank every HelperPlace applicant against the preferences that matter to your household — not a generic shortlist.",
  },
  {
    title: "Without a middleman",
    body: "You stay in control. Review, decide, and message helpers directly — no agency gatekeeping your pipeline.",
  },
  {
    title: "Without expensive agency fees",
    body: "DIY hiring for Singapore employers already on HelperPlace. Skip the agency markup and hire on your terms.",
  },
] as const;

const HOW_STEPS = [
  {
    n: "01",
    title: "Connect HelperPlace",
    body: "Link your employer account so applicants import into one inbox.",
  },
  {
    n: "02",
    title: "Rank by your preferences",
    body: "Scores update as new applicants arrive — sorted for your household.",
  },
  {
    n: "03",
    title: "Message on WhatsApp",
    body: "Reach out yourself when you’re ready. Nothing sends without you.",
  },
] as const;

function RankedListMock({ className = "" }: { className?: string }) {
  const rows = [
    { rank: 1, name: "Maria L.", fit: 94, note: "Infant care · Live-in", tone: "high" as const },
    { rank: 2, name: "Grace T.", fit: 88, note: "Elderly care · Transfer", tone: "high" as const },
    { rank: 3, name: "Ana R.", fit: 76, note: "General housework", tone: "mid" as const },
    { rank: 4, name: "Jenny C.", fit: 61, note: "Available Apr", tone: "low" as const },
  ];

  return (
    <div
      className={`landing-mock overflow-hidden rounded-lg border border-[var(--landing-ink)]/10 bg-[#f7f8f7]/95 ${className}`}
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-[var(--landing-ink)]/8 px-4 py-3">
        <p className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tracking-[0.06em] text-[var(--landing-ink-soft)] uppercase">
          Ranked inbox
        </p>
        <p className="font-[family-name:var(--font-source-sans)] text-xs text-[var(--landing-muted)]">
          By your preferences
        </p>
      </div>
      <ul className="divide-y divide-[var(--landing-ink)]/6">
        {rows.map((row) => (
          <li key={row.rank} className="flex items-center gap-3 px-4 py-3">
            <span className="w-5 font-[family-name:var(--font-fraunces)] text-sm text-[var(--landing-muted)] tabular-nums">
              {row.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-[family-name:var(--font-source-sans)] text-sm font-semibold text-[var(--landing-ink)]">
                {row.name}
              </p>
              <p className="truncate font-[family-name:var(--font-source-sans)] text-xs text-[var(--landing-muted)]">
                {row.note}
              </p>
            </div>
            <div className="flex w-16 flex-col items-end gap-1">
              <span className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tabular-nums text-[var(--landing-jade)]">
                {row.fit}%
              </span>
              <span className="h-1 w-full overflow-hidden rounded-sm bg-[var(--landing-ink)]/8">
                <span
                  className={`block h-full rounded-sm ${
                    row.tone === "high"
                      ? "bg-[var(--landing-jade)]"
                      : row.tone === "mid"
                        ? "bg-[var(--landing-jade)]/70"
                        : "bg-[var(--landing-muted)]/50"
                  }`}
                  style={{ width: `${row.fit}%` }}
                />
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductPreviewMock() {
  return (
    <div
      className="landing-preview-panel grid overflow-hidden rounded-lg border border-[var(--landing-ink)]/10 bg-[#f7f8f7]/95 sm:grid-cols-[1.15fr_0.85fr]"
      aria-hidden
    >
      <div className="border-b border-[var(--landing-ink)]/8 sm:border-r sm:border-b-0">
        <div className="flex items-center justify-between border-b border-[var(--landing-ink)]/8 px-4 py-3 sm:px-5">
          <p className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tracking-[0.06em] text-[var(--landing-ink-soft)] uppercase">
            Candidate fit
          </p>
          <p className="font-[family-name:var(--font-source-sans)] text-xs text-[var(--landing-muted)]">
            Daily import on
          </p>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-2xl font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
              Maria L.
            </p>
            <p className="mt-1 font-[family-name:var(--font-source-sans)] text-sm text-[var(--landing-muted)]">
              94% match · Infant care · Live-in · Available now
            </p>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Infant experience", value: 96 },
              { label: "Live-in preference", value: 92 },
              { label: "Availability", value: 88 },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="mb-1 flex justify-between font-[family-name:var(--font-source-sans)] text-xs text-[var(--landing-muted)]">
                  <span>{bar.label}</span>
                  <span className="tabular-nums text-[var(--landing-ink-soft)]">{bar.value}</span>
                </div>
                <span className="block h-1.5 overflow-hidden rounded-sm bg-[var(--landing-ink)]/8">
                  <span
                    className="landing-bar-fill block h-full rounded-sm bg-[var(--landing-jade)]"
                    style={{ width: `${bar.value}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-[#eef2f0]/80">
        <div className="border-b border-[var(--landing-ink)]/8 px-4 py-3 sm:px-5">
          <p className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tracking-[0.06em] text-[var(--landing-ink-soft)] uppercase">
            WhatsApp
          </p>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-2.5 p-4 sm:p-5">
          <div className="ml-auto max-w-[90%] rounded-md rounded-br-sm bg-[var(--landing-jade)] px-3 py-2 font-[family-name:var(--font-source-sans)] text-xs leading-relaxed text-[var(--landing-jade-fg)]">
            Hi Maria — we liked your profile and would love to chat about our household.
          </div>
          <div className="max-w-[85%] rounded-md rounded-bl-sm border border-[var(--landing-ink)]/8 bg-white/80 px-3 py-2 font-[family-name:var(--font-source-sans)] text-xs leading-relaxed text-[var(--landing-ink-soft)]">
            Thank you! Happy to share my availability this week.
          </div>
          <p className="pt-1 font-[family-name:var(--font-source-sans)] text-[11px] text-[var(--landing-muted)]">
            You send every message — nothing automatic.
          </p>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="landing relative min-h-screen overflow-x-hidden bg-[var(--landing-bg)] text-[var(--landing-ink)]">
      <div className="landing-atmosphere pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 sm:px-10">
        {/* —— Hero (first viewport) —— */}
        <section className="flex min-h-[100svh] flex-col py-8 sm:py-10">
          <header className="landing-fade-in flex items-center justify-between gap-4">
            <p className="text-sm tracking-[0.08em] text-[var(--landing-muted)] uppercase">
              Private beta
            </p>
            <Link
              href="/guide"
              className="text-sm font-medium text-[var(--landing-ink-soft)] underline decoration-[var(--landing-jade)]/35 underline-offset-4 transition-colors hover:text-[var(--landing-jade)]"
            >
              Setup guide
            </Link>
          </header>

          <div className="flex flex-1 flex-col justify-center gap-10 pb-10 pt-14 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-8">
            <div>
              <p className="landing-brand font-[family-name:var(--font-fraunces)] text-[clamp(3.25rem,11vw,6.75rem)] leading-[0.92] font-medium tracking-[-0.03em] text-[var(--landing-ink)]">
                Helper Hub
              </p>

              <h1 className="landing-rise mt-7 max-w-lg font-[family-name:var(--font-source-sans)] text-[clamp(1.3rem,3.2vw,1.75rem)] leading-snug font-semibold tracking-[-0.02em] text-[var(--landing-ink)] sm:mt-8">
                Find the perfect helper match — without a middleman or agency fees.
              </h1>

              <p className="landing-rise-delay mt-4 max-w-md font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
                Rank HelperPlace applicants by your preferences and message on WhatsApp yourself.
              </p>

              <div className="landing-cta mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-md bg-[var(--landing-jade)] px-6 py-3 text-sm font-semibold text-[var(--landing-jade-fg)] transition-[transform,background-color] duration-200 hover:bg-[var(--landing-jade-deep)] active:translate-y-px"
                >
                  Sign up
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-md border border-[var(--landing-ink)]/15 bg-white/40 px-6 py-3 text-sm font-semibold text-[var(--landing-ink)] backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 hover:border-[var(--landing-jade)]/40 hover:bg-white/70 active:translate-y-px"
                >
                  Sign in
                </Link>
              </div>
            </div>

            <RankedListMock className="landing-mock-enter w-full max-w-md self-center lg:max-w-none lg:justify-self-end" />
          </div>
        </section>

        {/* —— Why Helper Hub —— */}
        <section className="landing-section border-t border-[var(--landing-ink)]/10 py-20 sm:py-24">
          <p className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tracking-[0.1em] text-[var(--landing-jade)] uppercase">
            Why Helper Hub
          </p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4vw,2.35rem)] leading-tight font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
            Hire on your terms.
          </h2>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            Built for Singapore employers who already post on HelperPlace and want a calmer path from
            applicant to hire.
          </p>

          <ol className="mt-12 space-y-0 divide-y divide-[var(--landing-ink)]/10 border-y border-[var(--landing-ink)]/10">
            {WHY_REASONS.map((reason, i) => (
              <li key={reason.title} className="grid gap-3 py-7 sm:grid-cols-[3rem_1fr] sm:gap-8">
                <span className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--landing-jade)] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-[family-name:var(--font-source-sans)] text-lg font-semibold tracking-[-0.01em] text-[var(--landing-ink)]">
                    {reason.title}
                  </h3>
                  <p className="mt-2 max-w-2xl font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)]">
                    {reason.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* —— How it works —— */}
        <section className="landing-section border-t border-[var(--landing-ink)]/10 py-20 sm:py-24">
          <p className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tracking-[0.1em] text-[var(--landing-jade)] uppercase">
            How it works
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4vw,2.35rem)] leading-tight font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
            Three steps from applicants to outreach.
          </h2>

          <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {HOW_STEPS.map((step) => (
              <li key={step.n} className="relative">
                <span className="font-[family-name:var(--font-fraunces)] text-3xl font-medium tracking-[-0.03em] text-[var(--landing-jade)]/80">
                  {step.n}
                </span>
                <h3 className="mt-3 font-[family-name:var(--font-source-sans)] text-base font-semibold text-[var(--landing-ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 font-[family-name:var(--font-source-sans)] text-sm leading-relaxed text-[var(--landing-muted)] sm:text-[0.95rem]">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* —— Product preview —— */}
        <section className="landing-section border-t border-[var(--landing-ink)]/10 py-20 sm:py-24">
          <p className="font-[family-name:var(--font-source-sans)] text-xs font-semibold tracking-[0.1em] text-[var(--landing-jade)] uppercase">
            In the app
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4vw,2.35rem)] leading-tight font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
            See fit at a glance, then message directly.
          </h2>
          <p className="mt-3 max-w-xl font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            New applicants import daily. Scores follow your preferences. WhatsApp stays in your hands.
          </p>

          <div className="mt-12">
            <ProductPreviewMock />
          </div>
        </section>

        {/* —— Singapore employers —— */}
        <section className="landing-section border-t border-[var(--landing-ink)]/10 py-20 sm:py-24">
          <h2 className="max-w-2xl font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4vw,2.35rem)] leading-tight font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
            Built for Singapore employers hiring via HelperPlace.
          </h2>
          <p className="mt-4 max-w-xl font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            If you already post jobs and review applicants on HelperPlace, Helper Hub turns that stream
            into a ranked shortlist you can act on — without leaving DIY hiring for an agency.
          </p>
        </section>

        {/* —— Soft beta —— */}
        <section className="landing-section border-t border-[var(--landing-ink)]/10 py-20 sm:py-24">
          <h2 className="max-w-xl font-[family-name:var(--font-fraunces)] text-[clamp(1.75rem,4vw,2.25rem)] leading-tight font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
            Private beta — we’d love your feedback.
          </h2>
          <p className="mt-4 max-w-lg font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            New accounts are welcome while we refine the flow. The setup guide walks through connecting
            HelperPlace and ranking applicants.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-[var(--landing-jade)] px-6 py-3 text-sm font-semibold text-[var(--landing-jade-fg)] transition-[transform,background-color] duration-200 hover:bg-[var(--landing-jade-deep)] active:translate-y-px"
            >
              Join the beta
            </Link>
            <Link
              href="/guide"
              className="inline-flex items-center justify-center rounded-md border border-[var(--landing-ink)]/15 bg-white/40 px-6 py-3 text-sm font-semibold text-[var(--landing-ink)] backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 hover:border-[var(--landing-jade)]/40 hover:bg-white/70 active:translate-y-px"
            >
              Read the guide
            </Link>
          </div>
        </section>

        {/* —— Footer —— */}
        <footer className="flex flex-col gap-6 border-t border-[var(--landing-ink)]/10 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-fraunces)] text-lg font-medium tracking-[-0.02em] text-[var(--landing-ink)]">
            Helper Hub
          </p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-[family-name:var(--font-source-sans)] text-sm">
            <Link
              href="/sign-up"
              className="text-[var(--landing-ink-soft)] transition-colors hover:text-[var(--landing-jade)]"
            >
              Sign up
            </Link>
            <Link
              href="/sign-in"
              className="text-[var(--landing-ink-soft)] transition-colors hover:text-[var(--landing-jade)]"
            >
              Sign in
            </Link>
            <Link
              href="/guide"
              className="text-[var(--landing-ink-soft)] transition-colors hover:text-[var(--landing-jade)]"
            >
              Guide
            </Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
