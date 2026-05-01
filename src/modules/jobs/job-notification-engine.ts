import type { UserJobPreference } from "@/modules/personalization/personalization-schema";
import type { JobListing } from "./job-schema";

export type JobNotificationMatch = JobListing & {
  reasons: string[];
  score: number;
};

type BuildJobNotificationsInput = {
  preferences: UserJobPreference;
  jobs: JobListing[];
};

function includesPhrase(value: string, phrase: string) {
  return value.toLowerCase().includes(phrase.toLowerCase());
}

function collectReasons(job: JobListing, preferences: UserJobPreference) {
  const reasons: string[] = [];
  const jobTitle = job.title.toLowerCase();
  const roleInterests = preferences.roleInterests.filter(
    (role): role is string => typeof role === "string",
  );

  if (
    preferences.nursingInterest ||
    roleInterests.some((role) => role.includes("nurse")) ||
    preferences.certifications.includes("RN") ||
    preferences.licenseTypes.includes("registered_nurse")
  ) {
    if (jobTitle.includes("nurse") || jobTitle.includes("care coordinator")) {
      reasons.push("Matches your nursing credentials or stated interest.");
    }
  }

  if (
    preferences.teachingInterest ||
    roleInterests.some((role) => role.includes("teacher")) ||
    preferences.licenseTypes.includes("state_teaching_license")
  ) {
    if (jobTitle.includes("teacher") || jobTitle.includes("classroom")) {
      reasons.push("Matches your teaching interest or license path.");
    }
  }

  if (
    preferences.childCareInterest ||
    roleInterests.some((role) => role.includes("babysitter"))
  ) {
    if (jobTitle.includes("babysitter") || includesPhrase(job.summary, "homework support")) {
      reasons.push("Matches your childcare availability or stated role request.");
    }
  }

  if (
    preferences.petCareInterest ||
    roleInterests.some((role) => role.includes("dog walker"))
  ) {
    if (jobTitle.includes("dog walker") || includesPhrase(job.summary, "dog walking")) {
      reasons.push("Matches your pet-care interest and flexible local work preference.");
    }
  }

  for (const role of roleInterests) {
    if (jobTitle.includes(role)) {
      reasons.push(`Explicitly matches your requested role: ${role}.`);
    }
  }

  return [...new Set(reasons)];
}

function scoreMatch(job: JobListing, reasons: string[]) {
  const freshnessBoost = Math.max(0, 10 - job.postingAgeDays);
  return reasons.length * 25 + freshnessBoost;
}

export function buildJobNotifications(input: BuildJobNotificationsInput) {
  return input.jobs
    .map((job) => {
      const reasons = collectReasons(job, input.preferences);

      if (reasons.length === 0) {
        return null;
      }

      return {
        ...job,
        reasons,
        score: scoreMatch(job, reasons),
      } satisfies JobNotificationMatch;
    })
    .filter((job): job is JobNotificationMatch => job !== null)
    .sort((left, right) => right.score - left.score);
}