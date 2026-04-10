import type { DashboardBriefingTopicSource } from "./types";

export const dashboardBriefingSourceRegistry: ReadonlyArray<DashboardBriefingTopicSource> = [
  {
    key: "politics",
    label: "Politics",
    fields: [
      {
        id: "politics-policies",
        label: "Policies",
        sourceName: "Reuters Politics",
        sourceUrl: "https://www.reuters.com/world/",
        fallbackSummary:
          "Policy moves can change bills, benefits, and local costs fast.",
      },
      {
        id: "politics-world-relations",
        label: "World relations",
        sourceName: "AP World",
        sourceUrl: "https://apnews.com/hub/world-news",
        fallbackSummary:
          "Global alliances and tensions keep shifting the news cycle.",
      },
      {
        id: "politics-next-elections",
        label: "Next elections",
        sourceName: "BBC Elections",
        sourceUrl: "https://www.bbc.com/news",
        fallbackSummary:
          "Election calendars and campaign pressure are moving into focus.",
      },
    ],
  },
  {
    key: "science",
    label: "Science",
    fields: [
      {
        id: "science-breakthroughs",
        label: "Breakthroughs",
        sourceName: "NASA News",
        sourceUrl: "https://www.nasa.gov/news-release/",
        fallbackSummary:
          "Fresh research keeps changing what tomorrow can do.",
      },
      {
        id: "science-health-research",
        label: "Health research",
        sourceName: "NIH News",
        sourceUrl: "https://www.nih.gov/news-events/news-releases",
        fallbackSummary:
          "Medical studies keep adjusting the risk picture.",
      },
      {
        id: "science-space-updates",
        label: "Space updates",
        sourceName: "ESA News",
        sourceUrl: "https://www.esa.int/Newsroom/News",
        fallbackSummary:
          "Space missions keep adding new context to daily life.",
      },
    ],
  },
  {
    key: "agriculture",
    label: "Agriculture",
    fields: [
      {
        id: "agriculture-crop-outlook",
        label: "Crop outlook",
        sourceName: "USDA News",
        sourceUrl: "https://www.usda.gov/about-usda/news/press-releases",
        fallbackSummary:
          "Crop forecasts shift pricing, supply, and timing.",
      },
      {
        id: "agriculture-weather-risk",
        label: "Weather risk",
        sourceName: "NOAA News",
        sourceUrl: "https://www.noaa.gov/news",
        fallbackSummary:
          "Weather swings change the field plan fast.",
      },
      {
        id: "agriculture-farm-policy",
        label: "Farm policy",
        sourceName: "USDA Policy",
        sourceUrl: "https://www.usda.gov/media/press-releases",
        fallbackSummary:
          "Farm policy shapes costs and support for growers.",
      },
    ],
  },
  {
    key: "entertainment",
    label: "Entertainment",
    fields: [
      {
        id: "entertainment-new-releases",
        label: "New releases",
        sourceName: "Variety",
        sourceUrl: "https://variety.com/",
        fallbackSummary:
          "New launches steer attention and ad spend.",
      },
      {
        id: "entertainment-streaming-moves",
        label: "Streaming moves",
        sourceName: "Hollywood Reporter",
        sourceUrl: "https://www.hollywoodreporter.com/",
        fallbackSummary:
          "Streaming deals keep reshaping what people watch.",
      },
      {
        id: "entertainment-award-watch",
        label: "Award watch",
        sourceName: "The Wrap",
        sourceUrl: "https://www.thewrap.com/",
        fallbackSummary:
          "Award season can move buzz and bookings.",
      },
    ],
  },
  {
    key: "investments",
    label: "Investments",
    fields: [
      {
        id: "investments-rates",
        label: "Rates",
        sourceName: "Federal Reserve",
        sourceUrl: "https://www.federalreserve.gov/monetarypolicy.htm",
        fallbackSummary:
          "Interest-rate signals still drive budgets and debt costs.",
      },
      {
        id: "investments-market-movers",
        label: "Market movers",
        sourceName: "CNBC Markets",
        sourceUrl: "https://www.cnbc.com/markets/",
        fallbackSummary:
          "Market swings keep asset prices moving.",
      },
      {
        id: "investments-funds",
        label: "Funds",
        sourceName: "Morningstar",
        sourceUrl: "https://www.morningstar.com/",
        fallbackSummary:
          "Fund flows can hint where money is heading.",
      },
    ],
  },
];
