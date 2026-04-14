import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAUNCH_LOADING_THRESHOLD_MS,
  createLaunchLoadingTracker,
  shouldRevealLaunchLoadingWindow,
} from "./loading-controller";

describe("launch loading controller", () => {
  it("does not reveal before the threshold", () => {
    expect(shouldRevealLaunchLoadingWindow(DEFAULT_LAUNCH_LOADING_THRESHOLD_MS - 1)).toBe(false);
  });

  it("reveals at the threshold", () => {
    expect(shouldRevealLaunchLoadingWindow(DEFAULT_LAUNCH_LOADING_THRESHOLD_MS)).toBe(true);
  });

  it("keeps the overlay active until all tracked tasks finish", () => {
    const tracker = createLaunchLoadingTracker();
    const routeToken = tracker.startTask("route", 0);
    const artToken = tracker.startTask("art", 10);

    tracker.finishTask(routeToken, 260);
    expect(tracker.getSnapshot(260).isPending).toBe(true);

    tracker.finishTask(artToken, 265);
    expect(tracker.getSnapshot(265).isPending).toBe(false);
  });
});