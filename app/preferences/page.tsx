"use client";

import { useEffect, useMemo, useState } from "react";
import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";
import type { HardFilters, RankingWeights } from "@/lib/types";
import {
  DEFAULT_HARD_FILTERS,
  DEFAULT_RANKING_WEIGHTS,
  defaultTargetStartDate,
  formatTargetDateLabel,
} from "@/convex/lib/ranking";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ConvexGuard } from "@/components/ConvexGuard";

const DEFAULT_WEIGHTS: RankingWeights = DEFAULT_RANKING_WEIGHTS;

const STATIC_HARD_FILTER_FIELDS: Array<{
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

function startDateFilterCopy(targetStartDate: string): {
  label: string;
  description: string;
} {
  const formatted = formatTargetDateLabel(targetStartDate);
  if (formatted) {
    return {
      label: `Available by ${formatted}`,
      description: `Must be available on or before ${formatted} (your saved target start date)`,
    };
  }
  return {
    label: "Available by target start date",
    description: "Set your target start date below, then enable this filter",
  };
}

export default function PreferencesPage() {
  const prefs = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const [hardFilters, setHardFilters] = useState<HardFilters>(DEFAULT_HARD_FILTERS);
  const [rankingWeights, setRankingWeights] = useState<RankingWeights>(DEFAULT_WEIGHTS);
  const [desiredSkills, setDesiredSkills] = useState("");
  const [targetStartDate, setTargetStartDate] = useState("");
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);

  const hardFilterFields = useMemo(() => {
    const startCopy = startDateFilterCopy(targetStartDate);
    return [
      STATIC_HARD_FILTER_FIELDS[0],
      {
        key: "requireStartByOct2026" as const,
        label: startCopy.label,
        description: startCopy.description,
      },
      ...STATIC_HARD_FILTER_FIELDS.slice(1),
    ];
  }, [targetStartDate]);

  useEffect(() => {
    if (prefs) {
      setHardFilters({
        requireReferenceLetter: prefs.hardFilters.requireReferenceLetter,
        requireStartByOct2026: prefs.hardFilters.requireStartByOct2026,
        requireFinishedContractOrSingapore:
          prefs.hardFilters.requireFinishedContractOrSingapore,
        requireEnglish: prefs.hardFilters.requireEnglish,
        requireBabyChildCareInRecentWork:
          prefs.hardFilters.requireBabyChildCareInRecentWork,
      });
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
        targetStartDate: targetStartDate || defaultTargetStartDate(),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function markDirty() {
    setSaved(false);
  }

  const formattedTargetDate = formatTargetDateLabel(targetStartDate);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Preferences</h1>
        <p className="mt-1 text-sm text-stone-500">
          Personal settings for your account — filters, target start date, and
          ranking weights apply only to your candidate list.
        </p>
      </header>

      <ConvexGuard>
        {prefs === undefined ? (
          <LoadingState rows={4} />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target start date</CardTitle>
                <CardDescription>
                  When you need a helper to start. Used for the availability hard
                  filter and start-date scoring bonus.
                </CardDescription>
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
                {formattedTargetDate ? (
                  <p className="mt-2 text-xs text-stone-500">
                    Your filters and scores will use{" "}
                    <span className="font-medium text-stone-700">
                      {formattedTargetDate}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">
                    Pick a date so the availability filter label and scoring stay
                    accurate.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hard filters</CardTitle>
                <CardDescription>
                  Enable filters to exclude candidates who don&apos;t meet your
                  requirements. Use Inbox → &quot;Fails hard filters&quot; to review them.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {hardFilterFields.map(({ key, label, description }) => (
                  <div key={key} className="rounded-lg border border-stone-100 p-4">
                    <Checkbox
                      id={key}
                      label={label}
                      checked={hardFilters[key] === true}
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
                  Adjust how candidates are scored and ranked for your account.
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
