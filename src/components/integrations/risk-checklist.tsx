import { splitLabeledDetail } from "./split-labeled-detail";

type RiskChecklistProps = {
    title: string;
    items: string[];
};

export function RiskChecklist({ title, items }: RiskChecklistProps) {
    return (
        <div className="rounded-4xl border border-yellow-200/20 bg-yellow-300/10 p-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-yellow-50/90">
                {items.map((item) => {
                    const parts = splitLabeledDetail(item);

                    return (
                        <li key={item} className="rounded-3xl border border-yellow-200/15 bg-black/10 px-4 py-3">
                            {parts.heading ? (
                                <>
                                    <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-yellow-50/80">
                                        {parts.heading}
                                    </span>
                                    <span className="mt-1 block text-sm text-yellow-50/90">{parts.detail}</span>
                                </>
                            ) : (
                                <span className="block text-sm text-yellow-50/90">{parts.detail}</span>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
