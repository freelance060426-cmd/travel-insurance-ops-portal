"use client";

import { useEffect, useRef, useState } from "react";

type MultiSelectProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
};

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  disabled = false,
  disabledMessage,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.slice(0, 2).join(", ")} +${selected.length - 2} more`;

  return (
    <div className="multi-select" ref={containerRef}>
      <button
        type="button"
        className="multi-select__trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
      >
        <span className="multi-select__label">{label}</span>
        <svg
          className="multi-select__chevron"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {disabled && disabledMessage && (
        <small className="multi-select__hint">{disabledMessage}</small>
      )}

      {open && (
        <div className="multi-select__dropdown">
          <div className="multi-select__search-wrapper">
            <input
              className="multi-select__search"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <ul className="multi-select__list">
            {filtered.length === 0 && (
              <li className="multi-select__empty">No results</li>
            )}
            {filtered.map((option) => (
              <li key={option} className="multi-select__item">
                <label className="multi-select__option">
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => toggle(option)}
                  />
                  <span>{option}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
