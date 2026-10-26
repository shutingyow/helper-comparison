import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { BetaTesterGuideContent } from "@/components/guide/BetaTesterGuideContent";

export const metadata: Metadata = {
  title: "Beta Tester Guide — Helper Hub",
  description: "Setup and usage guide for Helper Hub beta testers",
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-warm-50">
      <header className="border-b border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-jade-100 text-jade-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-900">Helper Hub</p>
              <p className="text-xs text-stone-500">Beta tester guide</p>
            </div>
          </div>
          <Link
            href="/sign-up"
            className="rounded-lg bg-jade-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-jade-700"
          >
            Sign up
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-stone-900">
          Beta Tester Guide
        </h1>
        <BetaTesterGuideContent />
        <footer className="mt-12 border-t border-stone-200 pt-6 text-center text-sm text-stone-500">
          Ready to get started?{" "}
          <Link href="/sign-up" className="font-medium text-jade-700 hover:underline">
            Create your account
          </Link>
          {" · "}
          <Link href="/sign-in" className="font-medium text-jade-700 hover:underline">
            Sign in
          </Link>
        </footer>
      </main>
    </div>
  );
}
