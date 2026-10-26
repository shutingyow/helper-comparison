import Link from "next/link";

export function LandingPage() {
  return (
    <div className="landing relative min-h-screen overflow-hidden bg-[var(--landing-bg)] text-[var(--landing-ink)]">
      <div className="landing-atmosphere pointer-events-none absolute inset-0" aria-hidden />
      <div className="landing-grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-8 sm:px-10 sm:py-10">
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

        <main className="flex flex-1 flex-col justify-center pb-16 pt-20 sm:pb-24 sm:pt-12">
          <p className="landing-brand font-[family-name:var(--font-fraunces)] text-[clamp(3.25rem,12vw,7.5rem)] leading-[0.92] font-medium tracking-[-0.03em] text-[var(--landing-ink)]">
            Helper Hub
          </p>

          <h1 className="landing-rise mt-8 max-w-xl font-[family-name:var(--font-source-sans)] text-[clamp(1.35rem,3.4vw,1.85rem)] leading-snug font-semibold tracking-[-0.02em] text-[var(--landing-ink)] sm:mt-10">
            Rank HelperPlace applicants and hire with a clear pipeline.
          </h1>

          <p className="landing-rise-delay mt-4 max-w-md font-[family-name:var(--font-source-sans)] text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            Import applicants, score them against your preferences, and manage outreach in one calm
            place — without spreadsheet chaos.
          </p>

          <div className="landing-cta mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-md bg-[var(--landing-jade)] px-6 py-3 text-sm font-semibold text-[var(--landing-jade-fg)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-[var(--landing-jade-deep)] hover:shadow-[0_10px_30px_-12px_rgba(15,118,110,0.55)] active:translate-y-px"
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
        </main>
      </div>
    </div>
  );
}
