type SystemAccessWarningProps = {
    message: string;
};

export function SystemAccessWarning({ message }: SystemAccessWarningProps) {
    return (
        <div className="rounded-4xl border border-rose-200/20 bg-rose-300/10 p-6">
            <h2 className="text-xl font-semibold">System access warning</h2>
            <p className="mt-3 text-sm text-rose-50/90">{message}</p>
        </div>
    );
}
