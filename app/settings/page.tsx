"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";

export default function SettingsPage() {
  const credentials = useQuery(api.scraperCredentials.getForCurrentUser);
  const saveCredentials = useMutation(api.scraperCredentials.save);

  const [helperPlaceEmail, setHelperPlaceEmail] = useState("");
  const [password, setPassword] = useState("");
  const [applicantsUrl, setApplicantsUrl] = useState(
    "https://www.helperplace.com/find-candidate-singapore/applicant",
  );
  const [scrapeEnabled, setScrapeEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (credentials) {
      setHelperPlaceEmail(credentials.helperPlaceEmail);
      setApplicantsUrl(credentials.applicantsUrl);
      setScrapeEnabled(credentials.scrapeEnabled);
      setPassword("");
      setSaved(false);
    }
  }, [credentials]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      await saveCredentials({
        helperPlaceEmail,
        applicantsUrl,
        scrapeEnabled,
        ...(password ? { password } : {}),
      });
      setPassword("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save credentials");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">HelperPlace settings</h1>
        <p className="mt-1 text-sm text-stone-500">
          Connect your HelperPlace employer account so the scraper can import applicants.
          Your password is encrypted before storage and never shown again.
        </p>
      </header>

      <ConvexGuard>
        {credentials === undefined ? (
          <LoadingState rows={3} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account credentials</CardTitle>
                <CardDescription>
                  Use the same email and password you use to log in at helperplace.com as an
                  employer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="helperPlaceEmail">HelperPlace email</Label>
                  <Input
                    id="helperPlaceEmail"
                    type="email"
                    autoComplete="username"
                    value={helperPlaceEmail}
                    onChange={(e) => {
                      setHelperPlaceEmail(e.target.value);
                      setSaved(false);
                    }}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="password">
                    Password
                    {credentials?.hasPassword && (
                      <span className="ml-2 font-normal text-stone-500">
                        (leave blank to keep saved password)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setSaved(false);
                    }}
                    placeholder={credentials?.hasPassword ? "••••••••" : "Required"}
                    required={!credentials?.hasPassword}
                    className="mt-1"
                  />
                  {credentials?.hasPassword && (
                    <p className="mt-1 text-xs text-emerald-700">Password saved securely</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="applicantsUrl">Applicants page URL</Label>
                  <Input
                    id="applicantsUrl"
                    type="url"
                    value={applicantsUrl}
                    onChange={(e) => {
                      setApplicantsUrl(e.target.value);
                      setSaved(false);
                    }}
                    required
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-stone-500">
                    Open your job&apos;s applicants list in HelperPlace while logged in, then copy
                    the URL from your browser.
                  </p>
                </div>

                <div className="rounded-lg border border-stone-100 bg-stone-50/50 p-4 space-y-3">
                  <Checkbox
                    id="scrapeEnabled"
                    label="Enable daily automatic scrape"
                    checked={scrapeEnabled}
                    onChange={(e) => {
                      setScrapeEnabled(e.target.checked);
                      setSaved(false);
                    }}
                  />
                  <p className="text-xs text-stone-500">
                    When enabled, your applicants are imported automatically every day at 8:00am
                    Singapore time after you save your credentials. No extra setup required.
                  </p>
                </div>
              </CardContent>
            </Card>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">
                {saved ? "Credentials saved" : "Changes not saved yet"}
              </p>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save credentials"}
              </Button>
            </div>
          </form>
        )}
      </ConvexGuard>
    </div>
  );
}
