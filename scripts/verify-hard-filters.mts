import {
  evaluateHardFilters,
  hasAllRequiredTermsInRecentWork,
  mergeHardFilters,
  passesAllHardFilters,
} from "../convex/lib/ranking";

const nathali = {
  hasReferenceLetter: true,
  referenceLetterCount: 5,
  availableFrom: "01 Aug 2026",
  availableFromTimestamp: 1785542400000,
  contractStatus: "Transfer",
  presentLocation: "Singapore",
  languages: ["English", "Indonesian (Bahasa)"],
  skills: [
    "Baby Care",
    "Teen Care",
    "Elderly care",
    "Pet Care",
    "Housekeeping",
    "Cooking",
  ],
  yearsExperience: 14,
  name: "Nathali",
  workHistory: [
    {
      duties: "Housekeeping, Baby Care, Kids Care",
      employer: "French Family",
      hasReferenceLetter: true,
      period: "Nov 2025 - Jul 2026",
      title: "Domestic Helper",
    },
    {
      duties: "Cooking, Housekeeping, Elderly Care, Pet Care",
      employer: "Singaporean Family",
      hasReferenceLetter: true,
      period: "Apr 2018 - Nov 2025",
      title: "Domestic Helper",
    },
  ],
};

const filtersOff = mergeHardFilters({
  requireReferenceLetter: true,
  requireStartByOct2026: true,
  requireFinishedContractOrSingapore: true,
  requireEnglish: true,
  requireInRecentWork: false,
  requiredRecentWorkSkills: [],
});

const results = evaluateHardFilters(nathali, filtersOff, "2026-10-01");
const passes = passesAllHardFilters(results);
const hasRecentWorkFilter = results.some(
  (r) => r.filter === "required_in_recent_work",
);

if (hasRecentWorkFilter) {
  console.error("FAIL: recent work filter evaluated when disabled");
  process.exit(1);
}

if (!passes) {
  console.error("FAIL: Nathali should pass with recent work filter off");
  console.error(results);
  process.exit(1);
}

const allOff = mergeHardFilters({
  requireReferenceLetter: false,
  requireStartByOct2026: false,
  requireFinishedContractOrSingapore: false,
  requireEnglish: false,
  requireInRecentWork: false,
  requiredRecentWorkSkills: [],
});

const allOffResults = evaluateHardFilters(nathali, allOff, "2026-10-01");
if (!passesAllHardFilters(allOffResults) || allOffResults.length !== 0) {
  console.error("FAIL: all filters off should yield no evaluations and pass");
  process.exit(1);
}

if (mergeHardFilters({ requireInRecentWork: false }).requireInRecentWork) {
  console.error("FAIL: mergeHardFilters overwrote explicit false");
  process.exit(1);
}

const legacyMigrated = mergeHardFilters({
  requireBabyChildCareInRecentWork: true,
});
if (
  !legacyMigrated.requireInRecentWork ||
  legacyMigrated.requiredRecentWorkSkills.join(", ") !== "Baby Care, Child Care"
) {
  console.error("FAIL: legacy baby/child filter should migrate to recent work skills");
  console.error(legacyMigrated);
  process.exit(1);
}

const recentWorkOn = mergeHardFilters({
  requireReferenceLetter: false,
  requireStartByOct2026: false,
  requireFinishedContractOrSingapore: false,
  requireEnglish: false,
  requireInRecentWork: true,
  requiredRecentWorkSkills: ["Baby Care", "Child Care"],
});

if (!hasAllRequiredTermsInRecentWork(nathali.workHistory, ["Baby Care", "Child Care"])) {
  console.error("FAIL: Nathali should have baby and child care in recent work");
  process.exit(1);
}

const recentResults = evaluateHardFilters(nathali, recentWorkOn, "2026-10-01");
const recentFilter = recentResults.find((r) => r.filter === "required_in_recent_work");
if (!recentFilter?.passed) {
  console.error("FAIL: Nathali should pass configurable recent work filter");
  console.error(recentResults);
  process.exit(1);
}

const cookingOnly = mergeHardFilters({
  requireReferenceLetter: false,
  requireStartByOct2026: false,
  requireFinishedContractOrSingapore: false,
  requireEnglish: false,
  requireInRecentWork: true,
  requiredRecentWorkSkills: ["Cooking"],
});

const cookingResults = evaluateHardFilters(nathali, cookingOnly, "2026-10-01");
const cookingFilter = cookingResults.find((r) => r.filter === "required_in_recent_work");
if (!cookingFilter?.passed) {
  console.error("FAIL: Nathali should pass when only Cooking is required in recent work");
  process.exit(1);
}

console.log("OK: Nathali passes when recent work filter is off");
console.log("OK: mergeHardFilters preserves explicit false");
console.log("OK: disabled filters are not evaluated");
console.log("OK: legacy requireBabyChildCareInRecentWork migrates correctly");
console.log("OK: configurable recent work filter matches duties in top 2 jobs");
