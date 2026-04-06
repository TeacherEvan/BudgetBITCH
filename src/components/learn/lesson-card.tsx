import Link from "next/link";
import type { LearnLesson } from "@/modules/learn/module-schema";

type LessonCardProps = {
  lesson: LearnLesson;
};

export function LessonCard({ lesson }: LessonCardProps) {
  return (
    <article className="rounded-4xl border border-white/10 bg-black/20 p-5 text-white">
      <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">
        {lesson.category}
      </p>
      <h3 className="mt-3 text-2xl font-semibold">{lesson.title}</h3>
      <p className="mt-3 text-sm text-emerald-50/85">{lesson.summary}</p>
      <p className="mt-4 text-sm text-emerald-100/70">{lesson.whyItMatters}</p>
      <Link
        href={`/learn/${lesson.slug}`}
        className="mt-5 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
      >
        {lesson.nextActionLabel}
      </Link>
    </article>
  );
}
