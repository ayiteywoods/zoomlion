"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { globalSearchItems } from "@/lib/dashboard-data";
import { launchExternalSystem } from "@/lib/launch-system-client";
import { isExternalSystemId } from "@/lib/system-launch";

export const navSearchInputClass =
  "h-10 w-full appearance-none rounded-xl border border-gray-200/80 bg-gray-50 py-2 pl-11 pr-16 text-sm text-gray-900 shadow-sm outline-none transition-all duration-300 placeholder:text-gray-500 hover:border-gray-300 hover:bg-gray-50 focus:border-blue-400 focus:bg-gray-50 focus:ring-2 focus:ring-blue-400/25 [&::-webkit-search-cancel-button]:hidden";

type GlobalSearchProps = {
  className?: string;
  inputClassName?: string;
};

export function GlobalSearch({
  className = "",
  inputClassName = navSearchInputClass,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = globalSearchItems.filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const showResults = open && (query.length > 0 || filtered.length > 0);

  const focusSearch = useCallback(() => {
    inputRef.current?.focus();
    setOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        focusSearch();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusSearch]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className={`relative z-50 ${className}`}>
      <div className="group relative">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400 transition-colors duration-300 group-focus-within:text-blue-700"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search systems, sites…"
          className={inputClassName}
          role="combobox"
          aria-expanded={showResults}
          aria-controls="global-search-results"
          aria-autocomplete="list"
          aria-label="Search systems and sites"
        />
        {!query && (
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-gray-500 lg:inline">
            ⌘K
          </kbd>
        )}
      </div>

      {showResults && (
        <div
          id="global-search-results"
          role="listbox"
          className="animate-scale-in absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-xl border border-line bg-surface-elevated shadow-[0_16px_40px_rgba(0,0,0,0.15)] ring-1 ring-line"
        >
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-5 text-center text-sm text-muted">
                No results for &ldquo;{query}&rdquo;
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.id} role="option">
                  <Link
                    href={item.href}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      if (
                        item.openInNewTab &&
                        isExternalSystemId(item.id)
                      ) {
                        e.preventDefault();
                        launchExternalSystem(item.id);
                      }
                      setQuery("");
                      setOpen(false);
                    }}
                    className="flex flex-col gap-0.5 px-4 py-2.5 transition-colors hover:bg-primary-soft focus-visible:bg-primary-soft focus-visible:outline-none"
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-primary">
                        {item.label}
                      </span>
                      <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-muted">
                        {item.category}
                      </span>
                    </span>
                    <span className="text-xs text-muted">
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
