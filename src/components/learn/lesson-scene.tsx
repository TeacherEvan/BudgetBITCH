import type { LearnLessonScene } from "@/modules/learn/module-schema";

type LessonSceneProps = {
  scene: LearnLessonScene;
};

export function LessonScene({ scene }: LessonSceneProps) {
  return (
    <article className="rounded-4xl border border-white/10 bg-white/5 p-6 text-white">
      <h3 className="text-lg font-semibold text-yellow-200">Absurd scenario</h3>
      <p className="mt-3 text-sm text-emerald-50/85">{scene.absurdScenario}</p>

      <h3 className="mt-6 text-lg font-semibold text-yellow-200">
        Plain-English breakdown
      </h3>
      <p className="mt-3 text-sm text-emerald-50/85">{scene.plainEnglish}</p>

      <h3 className="mt-6 text-lg font-semibold text-yellow-200">Apply this now</h3>
      <p className="mt-3 text-sm text-emerald-50/85">{scene.applyNow}</p>
    </article>
  );
}
