import type { ProviderDefinition } from "@/modules/integrations/provider-types";
import Link from "next/link";
import { PrivacyBadge } from "./privacy-badge";

type ProviderCardProps = {
    provider: ProviderDefinition;
};

export function ProviderCard({ provider }: ProviderCardProps) {
    return (
        <article className="rounded-4xl border border-white/10 bg-black/20 p-6 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-yellow-200">
                        {provider.category.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{provider.label}</h3>
                </div>
                <span className="text-sm text-emerald-50/80">Risk: {provider.riskLevel}</span>
            </div>

            <p className="mt-3 text-sm text-emerald-50/80">
                Review the official links, privacy disclosure, and revoke controls before
                connecting this provider.
            </p>

            <div className="mt-4">
                <PrivacyBadge />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
                {provider.setupPath ? (
                    <Link
                        className="rounded-full border border-emerald-200/20 px-4 py-2 text-emerald-50 transition hover:bg-white/10"
                        href={provider.setupPath}
                    >
                        Open setup wizard
                    </Link>
                ) : (
                    <a
                        className="rounded-full border border-emerald-200/20 px-4 py-2 text-emerald-50 transition hover:bg-white/10"
                        href={provider.officialDocsUrl}
                    >
                        Guidance only
                    </a>
                )}
                <a
                    className="rounded-full border border-white/10 px-4 py-2 text-white transition hover:bg-white/10"
                    href={provider.officialLoginUrl}
                >
                    Official login
                </a>
            </div>
        </article>
    );
}
