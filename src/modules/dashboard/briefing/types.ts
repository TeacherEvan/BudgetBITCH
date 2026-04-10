export type DashboardBriefingTopicKey =
  | "politics"
  | "science"
  | "agriculture"
  | "entertainment"
  | "investments";

export type DashboardBriefingFieldSource = {
  id: string;
  label: string;
  sourceName: string;
  sourceUrl: string;
  fallbackSummary: string;
};

export type DashboardBriefingTopicSource = {
  key: DashboardBriefingTopicKey;
  label: string;
  fields: ReadonlyArray<DashboardBriefingFieldSource>;
};

export type DashboardBriefingField = {
  id: string;
  label: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  isFallback: boolean;
};

export type DashboardBriefingTopic = {
  key: DashboardBriefingTopicKey;
  label: string;
  fields: ReadonlyArray<DashboardBriefingField>;
};

export type DashboardBriefingSnapshot = {
  generatedAt: string;
  sourceStatus: "live" | "fallback";
  topics: ReadonlyArray<DashboardBriefingTopic>;
};

export type DashboardBriefingFetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type LoadDashboardBriefingOptions = {
  fetchImpl?: DashboardBriefingFetchLike;
  forceRefresh?: boolean;
  now?: Date;
};
