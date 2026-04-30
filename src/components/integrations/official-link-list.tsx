import { useTranslations } from "next-intl";

type OfficialLinkListProps = {
    loginUrl: string;
    docsUrl: string;
};

export function OfficialLinkList({ loginUrl, docsUrl }: OfficialLinkListProps) {
    const t = useTranslations("integrationsShared");

    return (
        <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">{t("officialLinksTitle")}</h2>
            <ul className="mt-4 space-y-3 text-sm text-emerald-50/85">
                <li>
                    <a className="underline underline-offset-4" href={loginUrl}>
                        {t("officialLogin")}
                    </a>
                </li>
                <li>
                    <a className="underline underline-offset-4" href={docsUrl}>
                        {t("officialDocs")}
                    </a>
                </li>
            </ul>
        </div>
    );
}
