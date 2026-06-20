import type { WorkHistoryEntry } from "../types.js";
import { sortWorkHistoryByRecency } from "../lib/workHistory.js";

/** Collect sibling text until the next h2 (HelperPlace uses h2 sections, h3/h4 content). */
export function parseSectionFromHeadingLines(
  lines: string[],
  headingPattern: RegExp,
): string {
  const start = lines.findIndex((line) => headingPattern.test(line.trim()));
  if (start === -1) return "";

  const chunks: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    if (/^(professional info|skills|about me|work experience|education|my expectations)/i.test(line)) {
      break;
    }
    chunks.push(line);
  }
  return chunks.join("\n");
}

export function parseSkillsSection(text: string): {
  skills: string[];
  languages: string[];
  cookingSkills: string[];
  otherSkills: string[];
  personalityTraits: string[];
} {
  const languages: string[] = [];
  const mainSkills: string[] = [];
  const cookingSkills: string[] = [];
  const otherSkills: string[] = [];
  const personalityTraits: string[] = [];

  if (!text) {
    return { skills: [], languages: [], cookingSkills, otherSkills, personalityTraits };
  }

  let mode: "languages" | "main" | "cooking" | "other" | "personality" | "skip" = "skip";
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (/^language/i.test(line)) {
      mode = "languages";
      continue;
    }
    if (/^main skills?/i.test(line)) {
      mode = "main";
      continue;
    }
    if (/^cooking skills?/i.test(line)) {
      mode = "cooking";
      continue;
    }
    if (/^other skills?/i.test(line)) {
      mode = "other";
      continue;
    }
    if (/^personality/i.test(line)) {
      mode = "personality";
      continue;
    }

    if (line.length > 60 || /^duties:/i.test(line)) continue;

    switch (mode) {
      case "languages":
        languages.push(line);
        break;
      case "main":
        mainSkills.push(line);
        break;
      case "cooking":
        cookingSkills.push(line);
        break;
      case "other":
        otherSkills.push(line);
        break;
      case "personality":
        personalityTraits.push(line);
        break;
      default:
        break;
    }
  }

  const skills = dedupe([...mainSkills, ...otherSkills]);

  return {
    skills,
    languages: dedupe(languages),
    cookingSkills: dedupe(cookingSkills),
    otherSkills: dedupe(otherSkills),
    personalityTraits: dedupe(personalityTraits),
  };
}

export function parseWorkHistory(text: string): WorkHistoryEntry[] {
  if (!text) return [];

  const blocks = text
    .split(/(?=^[A-Z][a-z]{2,8}\s+\d{4}\s*-\s*)/m)
    .map((b) => b.trim())
    .filter(Boolean);

  const entries: WorkHistoryEntry[] = [];

  for (const block of blocks) {
    const dateMatch = block.match(
      /^([A-Z][a-z]{2,8}\s+\d{4}\s*-\s*(?:[A-Z][a-z]{2,8}\s+\d{4}|Present|Now))/im,
    );
    if (!dateMatch) continue;

    const period = dateMatch[1]!.trim();
    const remainder = block.slice(dateMatch[0].length).trim();
    const lines = remainder.split("\n").map((l) => l.trim()).filter(Boolean);

    const titleLine =
      lines.find((l) => /domestic helper|driver|caregiver/i.test(l)) ?? lines[0] ?? "Domestic Helper";
    const locationMatch = titleLine.match(/\b(Singapore|Hong Kong|Malaysia|UAE|Saudi Arabia)\b/i);
    const title = titleLine.replace(/\s+(Singapore|Hong Kong|Malaysia|UAE|Saudi Arabia)\s*$/i, "").trim();
    const location = locationMatch?.[1];

    const employer =
      lines.find(
        (l) =>
          /family|employer|household/i.test(l) &&
          !/domestic helper|driver|duties|reference letter/i.test(l),
      ) ?? "";

    const dutiesLine = lines.find((l) => /^duties:/i.test(l));
    const duties = dutiesLine
      ? dutiesLine.replace(/^duties:\s*/i, "").trim()
      : lines
          .filter(
            (l) =>
              l !== titleLine &&
              l !== employer &&
              !/reference letter/i.test(l) &&
              !/^domestic helper/i.test(l),
          )
          .join(", ");

    const hasReferenceLetter = /I have a reference letter/i.test(block);

    entries.push({
      period,
      title,
      location,
      employer,
      duties,
      hasReferenceLetter,
    });
  }

  return sortWorkHistoryByRecency(entries);
}

export function parseExpectations(text: string): {
  salaryExpectation?: string;
  accommodation?: string;
  dayOff?: string;
} {
  if (!text) return {};

  const salary = text.match(/Salary:\s*\n?\s*(SG\$[^\n]+)/i)?.[1]?.trim();
  const accommodation = text.match(/Accommodation:\s*\n?\s*([^\n]+)/i)?.[1]?.trim();
  const dayOff = text.match(/Day Off:\s*\n?\s*([^\n]+)/i)?.[1]?.trim();

  return {
    salaryExpectation: salary,
    accommodation,
    dayOff,
  };
}

export function parseEducation(text: string): string | undefined {
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed || undefined;
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}
