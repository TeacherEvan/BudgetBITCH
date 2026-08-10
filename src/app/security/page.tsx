// app/security/page.tsx
// Visual "how your data stays safe" page. Static — no network calls.
import Link from 'next/link';
import { ShieldCheck, Lock, Smartphone, Cloud, ArrowRight } from 'lucide-react';

function SectionCard({
  testid,
  title,
  children,
}: {
  testid: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      data-testid={testid}
      className="rounded-2xl border border-[rgba(201,150,12,0.2)] bg-[#0a0a0a]/70 p-6"
    >
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#C9960C]">{title}</h2>
      <div className="text-sm leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

function StackDiagram() {
  const nodes = [
    { icon: Smartphone, label: 'Your Phone', sub: 'IndexedDB (encrypted)' },
    { icon: Lock, label: 'Service Worker', sub: 'cache + offline queue' },
    { icon: Cloud, label: 'Convex (TLS)', sub: 'your synced budget only' },
  ];
  return (
    <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-4">
          <div className="flex flex-col items-center rounded-xl border border-[rgba(201,150,12,0.25)] bg-white/5 px-4 py-3 text-center">
            <n.icon className="mb-1 h-6 w-6 text-[#E8B020]" />
            <span className="text-xs font-bold text-white/90">{n.label}</span>
            <span className="text-[10px] text-white/50">{n.sub}</span>
          </div>
          {i < nodes.length - 1 && <ArrowRight className="h-5 w-5 text-[#C9960C]" />}
        </div>
      ))}
    </div>
  );
}

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <ShieldCheck className="h-8 w-8 text-[#E8B020]" />
        <h1 className="text-xl font-bold uppercase tracking-widest text-[#C9960C]">
          How your data stays safe
        </h1>
      </div>

      <div className="space-y-6">
        <SectionCard testid="security-five-year-old" title="In plain words">
          <p>
            Think of your phone like a diary with a magic lock. Only you hold the key. When your
            diary needs to talk to the cloud, it sends a sealed box that even we cannot read — and
            the box travels through a guarded tunnel.
          </p>
        </SectionCard>

        <SectionCard testid="security-stack" title="Architecture">
          <StackDiagram />
          <p className="mt-4">
            Your budget lives on your device first. The service worker handles caching and an
            offline queue; only your synced budget is sent to Convex over an encrypted connection.
            <strong className="text-white/90">
              {' '}No personal data leaves your device except the budget you choose to sync.
            </strong>
          </p>
        </SectionCard>

        <SectionCard testid="security-encryption" title="Encryption flow">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong className="text-white/90">Local data:</strong> stored in IndexedDB and
              protected with <strong className="text-white/90">AES-GCM</strong> via the Web Crypto API.
            </li>
            <li>
              <strong className="text-white/90">In transit:</strong> every request to Convex uses{' '}
              <strong className="text-white/90">TLS 1.3</strong> — the same lock banks use.
            </li>
            <li>
              <strong className="text-white/90">At rest:</strong> Convex stores only the workspace
              data you explicitly sync; it cannot read your local device vault.
            </li>
          </ul>
        </SectionCard>

        <div className="rounded-2xl border border-[rgba(201,150,12,0.2)] bg-[#0a0a0a]/70 p-6 text-center">
          <p className="mb-3 text-sm text-white/60">
            Want the full legal details?
          </p>
          <Link
            href="/privacy"
            className="inline-block rounded-xl bg-[#C9960C] px-5 py-2.5 text-xs font-bold text-[#080600] transition-colors hover:bg-[#F5D742]"
          >
            Read the Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  );
}
