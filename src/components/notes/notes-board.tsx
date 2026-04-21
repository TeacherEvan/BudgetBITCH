"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";

type Note = {
  id: string;
  text: string;
  createdAt: string;
};

const STORAGE_KEY = "bb-notes";

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function buildId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function NotesBoard() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [input, setInput] = useState("");

  function handleAdd() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const next: Note[] = [
      { id: buildId(), text: trimmed, createdAt: new Date().toISOString() },
      ...notes,
    ];

    setNotes(next);
    saveNotes(next);
    setInput("");
  }

  function handleDelete(id: string) {
    const next = notes.filter((note) => note.id !== id);
    setNotes(next);
    saveNotes(next);
  }

  return (
    <section className="bb-panel bb-panel-strong mx-auto max-w-2xl p-5" aria-label="Notes board">
      <div className="flex gap-2">
        <label htmlFor="new-note-input" className="sr-only">
          New note
        </label>
        <input
          id="new-note-input"
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && handleAdd()}
          placeholder="Type a note and press Enter or Add note…"
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          aria-label="New note"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bb-button-primary px-4 py-2 text-sm"
          aria-label="Add note"
        >
          Add note
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="bb-mini-copy mt-6 text-center text-sm">No notes yet — add your first one above.</p>
      ) : (
        <ul className="mt-4 grid gap-2" aria-label="Notes list">
          {notes.map((note) => (
            <li key={note.id} className="bb-compact-card flex items-start justify-between gap-3 p-3">
              <span className="text-sm text-white">{note.text}</span>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                className="shrink-0 rounded p-1 text-white/40 transition-colors hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label={`Delete ${note.text}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
