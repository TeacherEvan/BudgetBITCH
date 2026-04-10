import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveBriefingRail } from "./live-briefing-rail";

const briefing = {
  generatedAt: "2026-04-10T12:00:00.000Z",
  sourceStatus: "live" as const,
  topics: [
    {
      key: "politics" as const,
      label: "Politics",
      fields: [
        {
          id: "politics-policies",
          label: "Policies",
          summary: "Policy moves stay active.",
          sourceName: "Reuters Politics",
          sourceUrl: "https://www.reuters.com/world/",
          isFallback: false,
        },
        {
          id: "politics-world-relations",
          label: "World relations",
          summary: "Global ties are shifting.",
          sourceName: "AP World",
          sourceUrl: "https://apnews.com/hub/world-news",
          isFallback: false,
        },
        {
          id: "politics-next-elections",
          label: "Next elections",
          summary: "Election calendars are tightening.",
          sourceName: "BBC Elections",
          sourceUrl: "https://www.bbc.com/news",
          isFallback: false,
        },
      ],
    },
    {
      key: "science" as const,
      label: "Science",
      fields: [
        {
          id: "science-breakthroughs",
          label: "Breakthroughs",
          summary: "New findings keep landing.",
          sourceName: "NASA News",
          sourceUrl: "https://www.nasa.gov/news-release/",
          isFallback: false,
        },
        {
          id: "science-health-research",
          label: "Health research",
          summary: "Medical studies are adjusting the risk picture.",
          sourceName: "NIH News",
          sourceUrl: "https://www.nih.gov/news-events/news-releases",
          isFallback: false,
        },
        {
          id: "science-space-updates",
          label: "Space updates",
          summary: "Space missions keep adding context.",
          sourceName: "ESA News",
          sourceUrl: "https://www.esa.int/Newsroom/News",
          isFallback: false,
        },
      ],
    },
    {
      key: "agriculture" as const,
      label: "Agriculture",
      fields: [
        {
          id: "agriculture-crop-outlook",
          label: "Crop outlook",
          summary: "Crop forecasts shift pricing.",
          sourceName: "USDA News",
          sourceUrl: "https://www.usda.gov/about-usda/news/press-releases",
          isFallback: false,
        },
        {
          id: "agriculture-weather-risk",
          label: "Weather risk",
          summary: "Weather swings change the field plan.",
          sourceName: "NOAA News",
          sourceUrl: "https://www.noaa.gov/news",
          isFallback: false,
        },
        {
          id: "agriculture-farm-policy",
          label: "Farm policy",
          summary: "Policy shapes costs and support.",
          sourceName: "USDA Policy",
          sourceUrl: "https://www.usda.gov/media/press-releases",
          isFallback: false,
        },
      ],
    },
    {
      key: "entertainment" as const,
      label: "Entertainment",
      fields: [
        {
          id: "entertainment-new-releases",
          label: "New releases",
          summary: "Launches steer attention and ad spend.",
          sourceName: "Variety",
          sourceUrl: "https://variety.com/",
          isFallback: false,
        },
        {
          id: "entertainment-streaming-moves",
          label: "Streaming moves",
          summary: "Streaming deals keep reshaping the lane.",
          sourceName: "Hollywood Reporter",
          sourceUrl: "https://www.hollywoodreporter.com/",
          isFallback: false,
        },
        {
          id: "entertainment-award-watch",
          label: "Award watch",
          summary: "Award season can move buzz and bookings.",
          sourceName: "The Wrap",
          sourceUrl: "https://www.thewrap.com/",
          isFallback: false,
        },
      ],
    },
    {
      key: "investments" as const,
      label: "Investments",
      fields: [
        {
          id: "investments-rates",
          label: "Rates",
          summary: "Interest-rate signals still drive costs.",
          sourceName: "Federal Reserve",
          sourceUrl: "https://www.federalreserve.gov/monetarypolicy.htm",
          isFallback: false,
        },
        {
          id: "investments-market-movers",
          label: "Market movers",
          summary: "Market swings keep asset prices moving.",
          sourceName: "CNBC Markets",
          sourceUrl: "https://www.cnbc.com/markets/",
          isFallback: false,
        },
        {
          id: "investments-funds",
          label: "Funds",
          summary: "Fund flows can hint where money is heading.",
          sourceName: "Morningstar",
          sourceUrl: "https://www.morningstar.com/",
          isFallback: false,
        },
      ],
    },
  ],
};

describe("LiveBriefingRail", () => {
  it("renders five core elements with three fields each", () => {
    render(<LiveBriefingRail briefing={briefing} />);

    expect(screen.getByRole("heading", { name: /live briefing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /politics/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /science/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /agriculture/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /entertainment/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /investments/i })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getAllByRole("listitem")).toHaveLength(15);
  });
});
