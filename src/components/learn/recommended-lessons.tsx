import type { LearnLesson } from "@/modules/learn/module-schema";
import { LessonCard } from "./lesson-card";

type RecommendedLessonsProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  lessons: LearnLesson[];
};

export function RecommendedLessons({
  eyebrow,
  title,
  description,
  lessons,
}: RecommendedLessonsProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 md:p-6">
      {eyebrow ? (
        <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      {description ? <p className="mt-2 text-sm text-emerald-50/75">{description}</p> : null}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.slug} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
