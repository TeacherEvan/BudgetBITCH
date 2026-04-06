import type { LearnLesson } from "@/modules/learn/module-schema";
import { LessonCard } from "./lesson-card";

type RecommendedLessonsProps = {
  title: string;
  lessons: LearnLesson[];
};

export function RecommendedLessons({
  title,
  lessons,
}: RecommendedLessonsProps) {
  if (lessons.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.slug} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
