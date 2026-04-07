import Link from "next/link";
import type { LearnLesson } from "@/modules/learn/module-schema";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";

type LessonCardProps = {
  lesson: LearnLesson;
};

export function LessonCard({ lesson }: LessonCardProps) {
  const leadScene = lesson.scenes[0];

  return (
    <article className="rounded-[24px] border border-white/10 bg-black/25 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">{lesson.category}</p>
        <div className="flex flex-wrap gap-2">
          {lesson.takeaways.slice(0, 2).map((takeaway) => (
            <span
              key={takeaway}
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-emerald-50/85"
            >
              {takeaway}
            </span>
          ))}
        </div>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-white">{lesson.title}</h3>
      <p className="mt-2 text-sm text-emerald-50/85">{lesson.summary}</p>

      <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-emerald-50/85">
        <p className="flex items-start gap-3">
          <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-yellow-200" />
          <span>{leadScene.absurdScenario}</span>
        </p>
        <p className="flex items-start gap-3">
          <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
          <span>{lesson.whyItMatters}</span>
        </p>
      </div>

      <Link
        href={`/learn/${lesson.slug}`}
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        {lesson.nextActionLabel}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </article>
  );
}
