type OfficialLinkListProps = {
    loginUrl: string;
    docsUrl: string;
};

export function OfficialLinkList({ loginUrl, docsUrl }: OfficialLinkListProps) {
    return (
        <div className="rounded-4xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">Official links</h2>
            <ul className="mt-4 space-y-3 text-sm text-emerald-50/85">
                <li>
                    <a className="underline underline-offset-4" href={loginUrl}>
                        Official login
                    </a>
                </li>
                <li>
                    <a className="underline underline-offset-4" href={docsUrl}>
                        Official docs
                    </a>
                </li>
            </ul>
        </div>
    );
}
