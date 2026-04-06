import { RecommendedLessons } from "@/components/learn/recommended-lessons";
import { getPrismaClient } from "@/lib/prisma";
import { extractLearnSignalsFromBlueprint } from "@/modules/learn/blueprint-bridge";
import { resolveLearnRecommendations } from "@/modules/learn/recommendation-engine";

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#34d399_0%,#14532d_45%,#052e16_100%)] px-6 py-10 text-white">
      <section className="mx-auto max-w-7xl rounded-[36px] border border-white/10 bg-black/20 p-8 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.3em] text-yellow-200">Learn!</p>
        <h1 className="mt-3 text-4xl font-bold">Absurd lessons. Real money moves.</h1>
        <p className="mt-4 max-w-3xl text-base text-emerald-50/85">
          Financial ideas stick better when the examples are ridiculous and the
          actions are practical.
        </p>

        <div className="mt-8 rounded-4xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Why these lessons</h2>
          <ul className="mt-3 grid gap-2 text-sm text-emerald-50/85">
            {recommendations.explainers.map((explainer) => (
              <li key={explainer}>{explainer}</li>
            ))}
          </ul>
        </div>

        <div className="mt-8 grid gap-8">
          <RecommendedLessons
            title="Recommended for your blueprint"
            lessons={recommendations.primary}
          />
          <RecommendedLessons
            title="Keep learning"
            lessons={recommendations.evergreen.slice(0, 4)}
          />
        </div>
      </section>
    </main>
  );
}
