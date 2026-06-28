"use client";

import { useEffect, useState } from "react";
import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";
import type { HardFilters, RankingWeights } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";

const DEFAULT_HARD_FILTERS: HardFilters = {
  requireReferenceLetter: true,
  requireStartByOct2026: true,
  requireFinishedContractOrSingapore: true,
  requireEnglish: true,
  requireBabyChildCareInRecentWork: true,
};

const DEFAULT_WEIGHTS: RankingWeights = {
  perReferenceLetter: 10,
  perDesiredSkill: 5,
  perYearExperience: 3,
  maxExperienceBonus: 25,
  startDateWithinTwoWeeks: 15,
  finishedContractSingaporeBonus: 10,
  profileCompleteness: 5,
};

const HARD_FILTER_FIELDS: Array<{
  key: keyof HardFilters;
  label: string;
  description: string;
}> = [
  {
    key: "requireReferenceLetter",
    label: "Reference letter required",
    description: "Exclude candidates without at least one reference letter",
  },
  {
    key: "requireStartByOct2026",
    label: "Start by Oct 2026",
    description: "Must be available by your target start date",
  },
  {
    key: "requireFinishedContractOrSingapore",
    label: "Finished contract or in Singapore",
    description: "Must have completed a contract or already be in SG",
  },
  {
    key: "requireEnglish",
    label: "English required",
    description: "Must list English as a spoken language",
  },
  {
    key: "requireBabyChildCareInRecentWork",
    label: "Baby & child care in recent work",
    description:
      "Baby care and child care must appear in duties for the most recent or second-most recent job — listing them only under skills is not enough",
  },
];

const WEIGHT_FIELDS: Array<{
  key: keyof RankingWeights;
  label: string;
}> = [
  { key: "perReferenceLetter", label: "Points per reference letter" },
  { key: "perDesiredSkill", label: "Points per desired skill match" },
  { key: "perYearExperience", label: "Points per year of experience" },
  { key: "maxExperienceBonus", label: "Max experience bonus cap" },
  { key: "startDateWithinTwoWeeks", label: "Start within 2 weeks bonus" },
  { key: "finishedContractSingaporeBonus", label: "Finished contract / SG bonus" },
  { key: "profileCompleteness", label: "Profile completeness bonus" },
];

export default function PreferencesPage() {
  const prefs = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const [hardFilters, setHardFilters] = useState<HardFilters>(DEFAULT_HARD_FILTERS);
  const [rankingWeights, setRankingWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [desiredSkills, setDesiredSkills] = useState("");
  const [targetStartDate, setTargetStartDate] = useState("2026-10-01");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs) {
      setHardFilters(prefs.hardFilters);
      setRankingWeights(prefs.rankingWeights);
      setDesiredSkills(prefs.desiredSkills.join(", "));
      setTargetStartDate(prefs.targetStartDate);
      setSaved(true);
    }
  }, [prefs]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences({
        hardFilters,
        rankingWeights,
        desiredSkills: desiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        targetStartDate,
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function markDirty() {
    setSaved(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Preferences</h1>
        <p className="mt-1 text-sm text-stone-500">
          Configure hard filters and ranking weights for candidate scoring.
        </p>
      </header>

      <ConvexGuard>
        {prefs === undefined ? (
          <LoadingState rows={4} />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hard filters</CardTitle>
                <CardDescription>
                  Enable filters to exclude candidates who don&apos;t meet your
                  requirements. Use Inbox → &quot;Fails hard filters&quot; to review them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {HARD_FILTER_FIELDS.map(({ key, label, description }) => (
                  <div key={key} className="rounded-lg border border-stone-100 p-4">
                    <Checkbox
                      id={key}
                      label={label}
                      checked={hardFilters[key]}
                      onChange={(e) => {
                        setHardFilters((f) => ({ ...f, [key]: e.target.checked }));
                        markDirty();
                      }}
                    />
                    <p className="mt-1 pl-6 text-xs text-stone-500">{description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Target start date</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="targetStartDate">Preferred helper start date</Label>
                <Input
                  id="targetStartDate"
                  type="date"
                  value={targetStartDate}
                  onChange={(e) => {
                    setTargetStartDate(e.target.value);
                    markDirty();
                  }}
                  className="mt-2 max-w-xs"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Desired skills</CardTitle>
                <CardDescription>
                  Comma-separated list for skill matching. Baby Care and Child Care
                  are verified from recent work history, not the skills section
                  alone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={desiredSkills}
                  onChange={(e) => {
                    setDesiredSkills(e.target.value);
                    markDirty();
                  }}
                  placeholder="e.g. cooking, childcare, elderly care"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking weights</CardTitle>
                <CardDescription>
                  Adjust how candidates are scored and ranked.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {WEIGHT_FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      type="number"
                      min={0}
                      value={rankingWeights[key]}
                      onChange={(e) => {
                        setRankingWeights((w) => ({
                          ...w,
                          [key]: Number(e.target.value),
                        }));
                        markDirty();
                      }}
                      className="mt-1"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">
                {saved ? "All changes saved" : "You have unsaved changes"}
              </p>
              <Button type="submit" disabled={saved || saving}>
                {saving ? "Saving…" : "Save preferences"}
              </Button>
            </div>
          </form>
        )}
      </ConvexGuard>
    </div>
  );
}
