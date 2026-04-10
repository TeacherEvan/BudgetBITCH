import { dashboardBriefingSourceRegistry } from "./source-registry";
import type {
  DashboardBriefingField,
  DashboardBriefingFetchLike,
  DashboardBriefingSnapshot,
  DashboardBriefingTopic,
  LoadDashboardBriefingOptions,
} from "./types";

const BRIEFING_CACHE_TTL_MS = 5 * 60 * 1000;
const BRIEFING_FETCH_HEADERS = {
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

type CachedBriefing = {
  createdAt: number;
  snapshot: DashboardBriefingSnapshot;
};

let cachedBriefing: CachedBriefing | null = null;

function stripMarkup(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function limitText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return value.slice(0, limit).trimEnd();
}

function normalizeFetchedSummary(rawText: string) {
  const cleaned = stripMarkup(rawText);

  if (!cleaned) {
    return null;
  }

  return limitText(cleaned, 140);
}

async function fetchFieldSummary(
  fetchImpl: DashboardBriefingFetchLike,
  field: (typeof dashboardBriefingSourceRegistry)[number]["fields"][number],
): Promise<{ field: DashboardBriefingField; usedFallback: boolean }> {
  try {
    const response = await fetchImpl(field.sourceUrl, {
      headers: BRIEFING_FETCH_HEADERS,
    });

    if (!response.ok) {
      return {
        field: {
          id: field.id,
          label: field.label,
          summary: field.fallbackSummary,
          sourceName: field.sourceName,
          sourceUrl: field.sourceUrl,
          isFallback: true,
        },
        usedFallback: true,
      };
    }

    const rawText = await response.text();
    const summary = normalizeFetchedSummary(rawText);

    if (!summary) {
      return {
        field: {
          id: field.id,
          label: field.label,
          summary: field.fallbackSummary,
          sourceName: field.sourceName,
          sourceUrl: field.sourceUrl,
          isFallback: true,
        },
        usedFallback: true,
      };
    }

    return {
      field: {
        id: field.id,
        label: field.label,
        summary,
        sourceName: field.sourceName,
        sourceUrl: field.sourceUrl,
        isFallback: false,
      },
      usedFallback: false,
    };
  } catch {
    return {
      field: {
        id: field.id,
        label: field.label,
        summary: field.fallbackSummary,
        sourceName: field.sourceName,
        sourceUrl: field.sourceUrl,
        isFallback: true,
      },
      usedFallback: true,
    };
  }
}

async function buildTopicSnapshot(
  fetchImpl: DashboardBriefingFetchLike,
  topic: (typeof dashboardBriefingSourceRegistry)[number],
): Promise<{ topic: DashboardBriefingTopic; usedFallback: boolean }> {
  const fieldResults = await Promise.all(
    topic.fields.map((field) => fetchFieldSummary(fetchImpl, field)),
  );

  return {
    topic: {
      key: topic.key,
      label: topic.label,
      fields: fieldResults.map((result) => result.field),
    },
    usedFallback: fieldResults.some((result) => result.usedFallback),
  };
}

function getFetchImpl(fetchImpl?: DashboardBriefingFetchLike) {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof globalThis.fetch !== "function") {
    throw new Error("fetch is not available in this runtime.");
  }

  return globalThis.fetch.bind(globalThis) as DashboardBriefingFetchLike;
}

export async function loadDashboardBriefing(
  options: LoadDashboardBriefingOptions = {},
): Promise<DashboardBriefingSnapshot> {
  const now = options.now ?? new Date();
  const shouldUseCache = !options.fetchImpl && !options.forceRefresh;

  if (
    shouldUseCache &&
    cachedBriefing &&
    now.getTime() - cachedBriefing.createdAt < BRIEFING_CACHE_TTL_MS
  ) {
    return cachedBriefing.snapshot;
  }

  const fetchImpl = getFetchImpl(options.fetchImpl);
  const topicResults = await Promise.all(
    dashboardBriefingSourceRegistry.map((topic) => buildTopicSnapshot(fetchImpl, topic)),
  );
  const sourceStatus = topicResults.some((result) => result.usedFallback)
    ? "fallback"
    : "live";
  const snapshot: DashboardBriefingSnapshot = {
    generatedAt: now.toISOString(),
    sourceStatus,
    topics: topicResults.map((result) => result.topic),
  };

  if (shouldUseCache) {
    cachedBriefing = {
      createdAt: now.getTime(),
      snapshot,
    };
  }

  return snapshot;
}

export function createSeededDashboardBriefing(
  now: Date = new Date(),
): DashboardBriefingSnapshot {
  return {
    generatedAt: now.toISOString(),
    sourceStatus: "fallback",
    topics: dashboardBriefingSourceRegistry.map((topic) => ({
      key: topic.key,
      label: topic.label,
      fields: topic.fields.map((field) => ({
        id: field.id,
        label: field.label,
        summary: field.fallbackSummary,
        sourceName: field.sourceName,
        sourceUrl: field.sourceUrl,
        isFallback: true,
      })),
    })),
  };
}
