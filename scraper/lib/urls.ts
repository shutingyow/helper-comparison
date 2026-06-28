const BASE_URL = "https://www.helperplace.com";

/** Default employer applicants list (Singapore) — must be logged in as employer */
export const DEFAULT_APPLICANTS_URL =
  "https://www.helperplace.com/find-candidate-singapore/applicant";

export function isApplicantsListUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return (
      path.includes("/applicant") ||
      path.includes("/application") ||
      path.includes("/applications")
    );
  } catch {
    return false;
  }
}

/** Public browse-all-candidates catalog (not your job applicants) */
export function isBrowseCatalogUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    if (isApplicantsListUrl(url)) return false;
    return (
      path === "/find-candidate" ||
      path === "/find-candidate-singapore" ||
      /^\/find-candidate-[^/]+\/?$/.test(path)
    );
  } catch {
    return false;
  }
}

/** Employer-only pages that confirm an authenticated employer session. */
export function isEmployerLandingUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return (
      isApplicantsListUrl(url) ||
      path.includes("/dashboard") ||
      path.includes("/manage-job")
    );
  } catch {
    return false;
  }
}

/**
 * Normalize a saved applicants URL. Browse-catalog paths are not employer applicant lists.
 */
export function resolveEmployerApplicantsUrl(url?: string): string {
  const trimmed = url?.trim();
  if (!trimmed) {
    return DEFAULT_APPLICANTS_URL;
  }

  if (isBrowseCatalogUrl(trimmed)) {
    return DEFAULT_APPLICANTS_URL;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.origin !== new URL(BASE_URL).origin) {
      return DEFAULT_APPLICANTS_URL;
    }
    return parsed.toString();
  } catch {
    return DEFAULT_APPLICANTS_URL;
  }
}
