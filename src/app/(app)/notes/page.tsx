import { MobilePanelFrame } from "@/components/mobile/mobile-panel-frame";
import { NotesBoard } from "@/components/notes/notes-board";

export default function NotesPage() {
  return (
    <main className="bb-page-shell text-white">
      <MobilePanelFrame>
      <section className="mx-auto max-w-7xl">
        <p className="bb-kicker">Tools</p>
        <h1 className="mt-3 text-4xl font-semibold">Notes</h1>
        <p className="bb-copy mt-3 max-w-xl text-sm">
          Quick scratchpad for budget thoughts, reminders, and anything that does not need a category yet.
        </p>
        <div className="mt-8">
          <NotesBoard />
        </div>
      </section>
      </MobilePanelFrame>
    </main>
  );
}
