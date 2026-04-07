import Link from "next/link";
import { getLearnModuleByKey } from "@/modules/learn/module-catalog";
import { ConfidenceBadge } from "./confidence-badge";

type BlueprintPanelProps = {
  blueprint: {
    priorityStack: string[];
    riskWarnings: string[];
    next7Days: string[];
    next30Days: string[];
    learnModuleKeys: string[];
    recommendedIntegrations: string[];
  };
  assumptions?: Array<{
    label: string;
    confidence: "verified" | "estimated" | "user_entered";
  }>;
};

export function BlueprintPanel({
  blueprint,
  assumptions = [],
}: BlueprintPanelProps) {
  const learnLessons = blueprint.learnModuleKeys.map((key) => {
    const lesson = getLearnModuleByKey(key as Parameters<typeof getLearnModuleByKey>[0]);

    return {
      key,
      title: lesson?.title ?? key,
      href: lesson ? `/learn/${lesson.slug}` : undefined,
    };
  });

  return (
    <section className="bb-start-smart-blueprint p-6 text-white">
      <p className="bb-start-smart-eyebrow">Money Survival Blueprint</p>
      <h2 className="mt-3 text-3xl font-semibold">What must I cover first?</h2>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="bb-start-smart-blueprint-card p-5" data-tone="priority">
          <h3 className="text-lg font-semibold">Priority stack</h3>
          <ul className="bb-start-smart-copy mt-3 grid gap-2 text-sm">
            {blueprint.priorityStack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="bb-start-smart-blueprint-card p-5" data-tone="risk">
          <h3 className="text-lg font-semibold">Risk warnings</h3>
          <ul className="bb-start-smart-copy mt-3 grid gap-2 text-sm">
            {blueprint.riskWarnings.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="bb-start-smart-blueprint-card p-5" data-tone="next">
          <h3 className="text-lg font-semibold">Next 7 days</h3>
          <ul className="bb-start-smart-copy mt-3 grid gap-2 text-sm">
            {blueprint.next7Days.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="bb-start-smart-blueprint-card p-5" data-tone="next">
          <h3 className="text-lg font-semibold">Next 30 days</h3>
          <ul className="bb-start-smart-copy mt-3 grid gap-2 text-sm">
            {blueprint.next30Days.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="bb-start-smart-blueprint-card p-5" data-tone="learn">
          <h3 className="text-lg font-semibold">Learn next</h3>
          <ul className="bb-start-smart-copy mt-3 grid gap-2 text-sm">
            {learnLessons.map((lesson) => (
              <li key={lesson.key}>
                {lesson.href ? (
                  <Link
                    href={lesson.href}
                    className="transition hover:text-yellow-200"
                  >
                    {lesson.title}
                  </Link>
                ) : (
                  lesson.title
                )}
              </li>
            ))}
          </ul>
        </article>

        <article className="bb-start-smart-blueprint-card p-5" data-tone="integrations">
          <h3 className="text-lg font-semibold">Suggested integrations</h3>
          <ul className="bb-start-smart-copy mt-3 grid gap-2 text-sm">
            {blueprint.recommendedIntegrations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      {assumptions.length > 0 ? (
        <article className="bb-start-smart-blueprint-card mt-6 p-5" data-tone="assumptions">
          <h3 className="text-lg font-semibold">Assumption quality</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {assumptions.map((assumption) => (
              <div
                key={`${assumption.label}-${assumption.confidence}`}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2"
              >
                <span className="bb-start-smart-copy text-sm">{assumption.label}</span>
                <ConfidenceBadge confidence={assumption.confidence} />
              </div>
            ))}
          </div>
        </article>
      ) : null}
    </section>
  );
}