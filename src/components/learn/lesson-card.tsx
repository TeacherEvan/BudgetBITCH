import Link from "next/link";
import type { LearnLesson } from "@/modules/learn/module-schema";
import { ArrowRight } from "lucide-react";

type LessonCardProps = {
  lesson: LearnLesson;
};

export function LessonCard({ lesson }: LessonCardProps) {
  const highlightedTakeaways = lesson.takeaways.slice(0, 2);

  return (
    <article className="rounded-3xl border border-white/10 bg-black/25 p-5 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">{lesson.category}</p>
      </div>

      <h3 className="mt-3 text-xl font-semibold text-white">{lesson.title}</h3>
      <p className="mt-2 text-sm text-emerald-50/85">{lesson.summary}</p>

      {highlightedTakeaways.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/75">Keep in mind</p>
          <ul className="mt-3 grid gap-2 text-sm text-emerald-50/85">
            {highlightedTakeaways.map((takeaway) => (
              <li key={takeaway} className="flex items-start gap-2">
                <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
