import { Calculator } from "@/components/calculator/calculator";

export default function CalculatorPage() {
  return (
    <main className="bb-page-shell text-white">
      <section className="mx-auto max-w-7xl">
        <p className="bb-kicker">Tools</p>
        <h1 className="mt-3 text-4xl font-semibold">Calculator</h1>
        <p className="bb-copy mt-3 max-w-xl text-sm">
          Quick arithmetic for budget checks — no number crunching in your head.
        </p>
        <div className="mt-8">
          <Calculator />
        </div>
      </section>
    </main>
  );
}
