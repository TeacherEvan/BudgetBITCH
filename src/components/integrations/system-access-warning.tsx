import { useTranslations } from "next-intl";
import { splitLabeledDetail } from "./split-labeled-detail";

type SystemAccessWarningProps = {
    message: string;
};

export function SystemAccessWarning({ message }: SystemAccessWarningProps) {
    const t = useTranslations("integrationsShared");
    const warning = splitLabeledDetail(message);

    return (
        <div className="rounded-4xl border border-rose-200/20 bg-rose-300/10 p-6">
            <h2 className="text-xl font-semibold">{t("systemAccessWarning")}</h2>
            <div className="mt-3 rounded-3xl border border-rose-200/15 bg-black/10 px-4 py-3 text-rose-50/90">
                {warning.heading ? (
                    <>
                        <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-rose-50/80">
                            {warning.heading}
                        </span>
                        <span className="mt-1 block text-sm">{warning.detail}</span>
                    </>
                ) : (
                    <p className="text-sm">{warning.detail}</p>
                )}
            </div>
        </div>
    );
}
