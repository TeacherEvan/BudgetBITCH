import { Calculator } from "@/components/calculator/calculator";
import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { getRequestMessages } from "@/i18n/server";

export default async function CalculatorPage() {
  const messages = await getRequestMessages();

  return (
    <main className="bb-page-shell text-white">
      <MobilePanelFrame>
      <section className="mx-auto max-w-7xl">
        <p className="bb-kicker">{messages.calculatorPage.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold">{messages.calculatorPage.title}</h1>
        <p className="bb-helper-copy mt-3 max-w-xl text-sm">
          {messages.calculatorPage.description}
        </p>
        <div className="mt-8">
          <Calculator />
        </div>
      </section>
      </MobilePanelFrame>
    </main>
  );
}
