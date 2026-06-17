export interface WorkHistoryEntry {
  period: string;
  title: string;
  location?: string;
  employer: string;
  duties: string;
  hasReferenceLetter: boolean;
}

export interface ScrapeCandidate {
  helperPlaceId: string;
  profileUrl: string;
  name: string;
  age?: number;
  gender?: string;
  nationality?: string;
  contractStatus?: string;
  presentLocation?: string;
  yearsExperience?: number;
  availableFrom?: string;
  skills: string[];
  languages: string[];
  cookingSkills?: string[];
  personalityTraits?: string[];
  hasReferenceLetter: boolean;
  referenceLetterCount: number;
  workHistory: WorkHistoryEntry[];
  aboutMe?: string;
  education?: string;
  salaryExpectation?: string;
  accommodation?: string;
  dayOff?: string;
  phone?: string;
  whatsapp?: string;
  rawHtml?: string;
  scrapedAt: number;
}

export interface ScrapeRun {
  startedAt: number;
  finishedAt: number;
  errors?: string[];
}

export interface IngestPayload {
  candidates: ScrapeCandidate[];
  scrapeRun: ScrapeRun;
}

export interface IngestResponse {
  newCount: number;
  updatedCount: number;
}
