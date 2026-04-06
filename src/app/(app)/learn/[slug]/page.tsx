import { LessonScene } from "@/components/learn/lesson-scene";
import { getLearnModuleBySlug } from "@/modules/learn/module-catalog";
import { notFound } from "next/navigation";

type LearnLessonPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LearnLessonPage({
  params,
}: LearnLessonPageProps) {
  const { slug } = await params;
  const lesson = getLearnModuleBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl rounded-[36px] border border-white/10 bg-black/20 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Learn!</p>
        <h1 className="mt-3 text-4xl font-bold">{lesson.title}</h1>
        <p className="mt-4 text-base text-emerald-50/85">{lesson.summary}</p>

        <article className="mt-8 rounded-4xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Why it matters</h2>
          <p className="mt-3 text-sm text-emerald-50/85">{lesson.whyItMatters}</p>
        </article>

        <div className="mt-8 grid gap-6">
          {lesson.scenes.map((scene) => (
            <LessonScene key={scene.id} scene={scene} />
          ))}
        </div>

        <article className="mt-8 rounded-4xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Takeaways</h2>
          <ul className="mt-3 grid gap-2 text-sm text-emerald-50/85">
            {lesson.takeaways.map((takeaway) => (
              <li key={takeaway}>{takeaway}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
