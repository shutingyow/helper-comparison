import {
  evaluateHardFilters,
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
  requireBabyChildCareInRecentWork: false,
});

const results = evaluateHardFilters(nathali, filtersOff, "2026-10-01");
const passes = passesAllHardFilters(results);
const hasBabyFilter = results.some((r) => r.filter === "baby_child_care_recent_work");

if (hasBabyFilter) {
  console.error("FAIL: baby/child care filter evaluated when disabled");
  process.exit(1);
}

if (!passes) {
  console.error("FAIL: Nathali should pass with baby/child care filter off");
  console.error(results);
  process.exit(1);
}

const allOff = mergeHardFilters({
  requireReferenceLetter: false,
  requireStartByOct2026: false,
  requireFinishedContractOrSingapore: false,
  requireEnglish: false,
  requireBabyChildCareInRecentWork: false,
});

const allOffResults = evaluateHardFilters(nathali, allOff, "2026-10-01");
if (!passesAllHardFilters(allOffResults) || allOffResults.length !== 0) {
  console.error("FAIL: all filters off should yield no evaluations and pass");
  process.exit(1);
}

if (mergeHardFilters({ requireBabyChildCareInRecentWork: false }).requireBabyChildCareInRecentWork) {
  console.error("FAIL: mergeHardFilters overwrote explicit false");
  process.exit(1);
}

console.log("OK: Nathali passes when requireBabyChildCareInRecentWork is off");
console.log("OK: mergeHardFilters preserves explicit false");
console.log("OK: disabled filters are not evaluated");
