"use client";

import { useState } from "react";
import {
  DEFAULT_LAUNCH_LOADING_THRESHOLD_MS,
  createLaunchLoadingTracker,
} from "@/modules/launch/loading-controller";
import { prepareLaunchTransitionResources } from "@/components/launch/load-money-loading-art";

type LaunchTransitionState = {
  visible: boolean;
  reasons: string[];
  showArt: boolean;
};

type UseLaunchTransitionOptions = {
  onReady: () => void;
};

function getReducedMotionPreference() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useLaunchTransition({ onReady }: UseLaunchTransitionOptions) {
  const [transitionState, setTransitionState] = useState<LaunchTransitionState>({
    visible: false,
    reasons: [],
    showArt: false,
  });

  async function beginTransition() {
    const tracker = createLaunchLoadingTracker();
    const startedAt = Date.now();
    const routeToken = tracker.startTask("route", startedAt);
    const artToken = tracker.startTask("art", startedAt);

    setTransitionState({ visible: false, reasons: [], showArt: false });

    const revealTimer = window.setTimeout(() => {
      const snapshot = tracker.getSnapshot(Date.now());

      if (snapshot.shouldReveal) {
        setTransitionState({
          visible: true,
          reasons: snapshot.activeReasons,
          showArt: false,
        });
      }
    }, DEFAULT_LAUNCH_LOADING_THRESHOLD_MS);

    await Promise.resolve();
    tracker.finishTask(routeToken, Date.now());

    try {
      await prepareLaunchTransitionResources();
      setTransitionState((current) =>
        current.visible ? { ...current, showArt: true } : current,
      );
    } finally {
      tracker.finishTask(artToken, Date.now());
    }

    window.clearTimeout(revealTimer);
    setTransitionState({ visible: false, reasons: [], showArt: false });
    onReady();
  }

  return {
    beginTransition,
    loadingWindow: {
      ...transitionState,
      reducedMotion: getReducedMotionPreference(),
    },
  };
}