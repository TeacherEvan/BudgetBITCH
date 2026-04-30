import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { NotesBoard } from "@/components/notes/notes-board";
import { getRequestMessages } from "@/i18n/server";

export default async function NotesPage() {
  const messages = await getRequestMessages();

  return (
    <main className="bb-page-shell text-white">
      <MobilePanelFrame>
      <section className="mx-auto max-w-7xl">
        <p className="bb-kicker">{messages.notesPage.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold">{messages.notesPage.title}</h1>
        <p className="bb-copy mt-3 max-w-xl text-sm">
          {messages.notesPage.description}
        </p>
        <div className="mt-8">
          <NotesBoard />
        </div>
      </section>
      </MobilePanelFrame>
    </main>
  );
}
