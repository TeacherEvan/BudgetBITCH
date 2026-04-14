export type LaunchLoadingReason = "route" | "art" | "options";

export const DEFAULT_LAUNCH_LOADING_THRESHOLD_MS = 250;

type LaunchTaskRecord = {
  token: number;
  reason: LaunchLoadingReason;
  startedAt: number;
  finishedAt: number | null;
};

export function shouldRevealLaunchLoadingWindow(elapsedMs: number): boolean {
  return elapsedMs >= DEFAULT_LAUNCH_LOADING_THRESHOLD_MS;
}

export function createLaunchLoadingTracker() {
  let nextToken = 1;
  const tasks = new Map<number, LaunchTaskRecord>();

  return {
    startTask(reason: LaunchLoadingReason, startedAt: number) {
      const token = nextToken++;
      tasks.set(token, { token, reason, startedAt, finishedAt: null });
      return token;
    },
    finishTask(token: number, finishedAt: number) {
      const record = tasks.get(token);

      if (!record) {
        return;
      }

      record.finishedAt = finishedAt;
    },
    getSnapshot(now: number) {
      const active = [...tasks.values()].filter(
        (task) => task.finishedAt === null || task.finishedAt > now,
      );

      const oldest = active.reduce<number | null>((value, task) => {
        if (value === null) {
          return task.startedAt;
        }

        return Math.min(value, task.startedAt);
      }, null);

      const elapsed = oldest === null ? 0 : now - oldest;

      return {
        isPending: active.length > 0,
        activeReasons: [...new Set(active.map((task) => task.reason))],
        shouldReveal: active.length > 0 && shouldRevealLaunchLoadingWindow(elapsed),
        elapsed,
      };
    },
  };
}