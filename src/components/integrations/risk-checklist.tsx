type RiskChecklistProps = {
    title: string;
    items: string[];
};

export function RiskChecklist({ title, items }: RiskChecklistProps) {
    return (
        <div className="rounded-4xl border border-yellow-200/20 bg-yellow-300/10 p-6">
            <h2 className="text-xl font-semibold">{title}</h2>
            <ul className="mt-4 space-y-3 text-sm text-yellow-50/90">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}
