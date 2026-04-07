import { RecommendedLessons } from "@/components/learn/recommended-lessons";
import { getPrismaClient } from "@/lib/prisma";
import { extractLearnSignalsFromBlueprint } from "@/modules/learn/blueprint-bridge";
import { resolveLearnRecommendations } from "@/modules/learn/recommendation-engine";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";

function shouldUseSeededLearnFallback(error: unknown) {
  return (
    error instanceof Error &&
    (error.message === "DATABASE_URL is not configured for Prisma runtime access." ||
      error.name.startsWith("PrismaClient"))
  );
}

async function getLearnRecommendations() {
  try {
    const prisma = getPrismaClient();
    const latestBlueprint = await prisma.moneyBlueprintSnapshot.findFirst({
      where: { workspaceId: "demo_workspace" },
      orderBy: { createdAt: "desc" },
    });

    if (!latestBlueprint) {
      return resolveLearnRecommendations({
        learnModuleKeys: [],
        priorityStack: ["cover_essentials"],
        riskWarnings: [],
      });
    }

    const blueprintJson =
      typeof latestBlueprint.blueprintJson === "object" &&
      latestBlueprint.blueprintJson !== null
        ? latestBlueprint.blueprintJson
        : {};

    return resolveLearnRecommendations(
      extractLearnSignalsFromBlueprint(
        blueprintJson as {
          priorityStack?: string[];
          riskWarnings?: string[];
          learnModuleKeys?: string[];
        },
      ),
    );
  } catch (error) {
    if (shouldUseSeededLearnFallback(error)) {
      return resolveLearnRecommendations({
        learnModuleKeys: [],
        priorityStack: ["cover_essentials"],
        riskWarnings: [],
      });
    }

    throw error;
  }
}

export default async function LearnPage() {
  const recommendations = await getLearnRecommendations();
  const storyCues = [...recommendations.primary, ...recommendations.evergreen]
    .slice(0, 3)
    .map((lesson) => ({
      key: lesson.key,
      title: lesson.title,
      category: lesson.category,
      scene: lesson.scenes[0],
    }));

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-6 backdrop-blur md:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Learn!</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              Comic-strip lessons for the money move that matters next.
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-emerald-50/85 sm:text-base">
              Skip the explainer wall. Start with fast visual cues, then open the lesson card only
              when you want the deeper breakdown.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {recommendations.explainers.map((explainer) => (
              <span
                key={explainer}
                className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-emerald-50/85"
              >
                {explainer}
              </span>
            ))}
          </div>
        </header>

        <section aria-labelledby="story-cues-heading" className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-yellow-200">Story cues</p>
              <h2 id="story-cues-heading" className="mt-2 text-2xl font-semibold text-white">
                Three fast scenes to anchor the idea
              </h2>
            </div>
            <p className="text-sm text-emerald-50/75">
              Absurd setup, plain-English meaning, and one action cue per card.
            </p>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-3">
            {storyCues.map((cue) => (
              <article
                key={cue.key}
                className="rounded-[28px] border border-white/10 bg-white/5 p-5"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-yellow-200">
                  {cue.category}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">{cue.title}</h3>

                <div className="mt-4 grid gap-3 text-sm text-emerald-50/85">
                  <p className="flex items-start gap-3">
                    <Sparkles aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-yellow-200" />
                    <span>{cue.scene.absurdScenario}</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <Lightbulb aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                    <span>{cue.scene.plainEnglish}</span>
                  </p>
                  <p className="flex items-start gap-3">
                    <ArrowRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-200" />
                    <span>{cue.scene.applyNow}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6">
          <RecommendedLessons
            eyebrow="Blueprint picks"
            title="Start here"
            description="Highest-signal lessons matched to your current blueprint pressure."
            lessons={recommendations.primary}
          />
          <RecommendedLessons
            eyebrow="Keep the streak"
            title="Next up"
            description="Evergreen refreshers when you want one more useful concept without a long scroll."
            lessons={recommendations.evergreen.slice(0, 4)}
          />
        </div>
      </section>
    </main>
  );
}
