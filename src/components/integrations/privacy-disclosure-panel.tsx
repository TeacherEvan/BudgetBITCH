type PrivacyDisclosurePanelProps = {
    providerLabel: string;
};

const disclosures = [
    "Only explicitly connected providers receive the minimum required data.",
    "No silent sharing or automatic cross-provider routing.",
    "You can revoke and disconnect this provider at any time.",
];

export function PrivacyDisclosurePanel({ providerLabel }: PrivacyDisclosurePanelProps) {
    return (
        <div className="rounded-4xl border border-emerald-200/20 bg-emerald-300/10 p-6">
            <h2 className="text-xl font-semibold">Privacy Shield</h2>
            <p className="mt-3 text-sm text-emerald-50/85">
                Review how {providerLabel} receives data before enabling any connection.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-white">
                {disclosures.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}
