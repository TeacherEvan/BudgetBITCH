"use client";

import { useId, useMemo, useRef, useState } from "react";

export type SearchableComboboxOption = {
  value: string;
  label: string;
  description?: string;
  keywords?: string[];
};

type SearchableComboboxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onOptionSelect?: (option: SearchableComboboxOption) => void;
  loadOptions: () => Promise<SearchableComboboxOption[]>;
  placeholder?: string;
};

function matchesQuery(option: SearchableComboboxOption, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const haystack = [option.label, option.description ?? "", ...(option.keywords ?? [])]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export function SearchableCombobox({
  label,
  value,
  onChange,
  onOptionSelect,
  loadOptions,
  placeholder,
}: SearchableComboboxProps) {
  const listboxId = useId();
  const inputId = useId();
  const optionsLoadedRef = useRef(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchableComboboxOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredOptions = useMemo(
    () => options.filter((option) => matchesQuery(option, query)),
    [options, query],
  );

  const activeOption = activeIndex >= 0 ? filteredOptions[activeIndex] : null;

  async function ensureOptionsLoaded() {
    if (optionsLoadedRef.current) {
      return;
    }

    const loadedOptions = await loadOptions();
    optionsLoadedRef.current = true;
    setOptions(loadedOptions);
  }

  function commitSelection(option: SearchableComboboxOption) {
    setQuery(option.label);
    setIsOpen(false);
    setActiveIndex(-1);
    onChange(option.value);
    onOptionSelect?.(option);
  }

  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <div className="relative">
        <input
          id={inputId}
          aria-activedescendant={activeOption ? `${inputId}-option-${activeOption.value}` : undefined}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-label={label}
          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            void ensureOptionsLoaded();
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              void ensureOptionsLoaded();
              setIsOpen(true);
              setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((index) => Math.max(index - 1, 0));
            }

            if (event.key === "Enter" && activeOption) {
              event.preventDefault();
              commitSelection(activeOption);
            }

            if (event.key === "Escape") {
              setIsOpen(false);
              setActiveIndex(-1);
            }
          }}
          role="combobox"
          placeholder={placeholder}
          value={query}
        />

        {isOpen ? (
          <div
            className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-2xl"
            id={listboxId}
            role="listbox"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={option.value}
                id={`${inputId}-option-${option.value}`}
                aria-selected={index === activeIndex}
                className="grid w-full rounded-xl px-3 py-2 text-left transition hover:bg-white/8 focus:bg-white/8"
                onClick={() => commitSelection(option)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                <span className="font-semibold text-white">{option.label}</span>
                {option.description ? (
                  <span className="bb-mini-copy mt-1 block">{option.description}</span>
                ) : null}
              </button>
            ))}
            {filteredOptions.length === 0 ? (
              <p className="bb-mini-copy px-3 py-2">No matching options yet.</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <input type="hidden" value={value} readOnly />
    </label>
  );
}