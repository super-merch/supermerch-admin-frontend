// components/AddressAutocomplete.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Nominatim (OpenStreetMap) address autocomplete.
 * Props:
 * - placeholder: string
 * - defaultValue: string
 * - countryCode: string (optional)  // <-- ISO 2-letter code like "au"
 * - email: string (optional)        // <-- polite identification for Nominatim
 * - onSelect: function(place)
 */
export default function AddressAutocomplete({
  placeholder = "Start typing address...",
  defaultValue = "",
  countryCode = "", // use ISO 2-letter code, e.g. "au"
  email = "",
  onSelect = () => {},
}) {
  const [input, setInput] = useState(defaultValue || "");
  const [items, setItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapperRef = useRef(null);
  const cacheRef = useRef(new Map());
  const debounceRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlight(-1);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    if (!input || input.length < 2) {
      setItems([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const q = input.trim();
      if (cacheRef.current.has(q)) {
        setItems(cacheRef.current.get(q));
        setIsOpen(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "6");
        url.searchParams.set("q", q);
        // IMPORTANT: use countrycodes (ISO 2-letter) not 'country'
        if (countryCode) url.searchParams.set("countrycodes", countryCode);
        // polite identification (optional but recommended)
        if (email) url.searchParams.set("email", email);

        const res = await fetch(url.toString(), {
          headers: {
            "Accept-Language": "en",
          },
        });

        if (!res.ok) {
          console.error("Nominatim responded with status:", res.status);
          setItems([]);
          setIsOpen(false);
          setLoading(false);
          return;
        }

        const json = await res.json();
        cacheRef.current.set(q, json);
        setItems(json);
        setIsOpen(true);
      } catch (err) {
        console.error("Nominatim error:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [input, countryCode, email]);

  function handleKeyDown(e) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && items[highlight]) selectItem(items[highlight]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlight(-1);
    }
  }

  function selectItem(item) {
    setInput(item.display_name);
    setIsOpen(false);
    setItems([]);
    setHighlight(-1);
    onSelect(item);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        type="text"
        value={input}
        placeholder={placeholder}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (items.length > 0) setIsOpen(true);
        }}
        className="w-full p-2 border"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      />

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow max-h-56 overflow-auto text-sm"
        >
          {loading && <li className="p-2 text-gray-500">Searching…</li>}
          {!loading && items.length === 0 && (
            <li className="p-2 text-gray-500">No addresses found</li>
          )}
          {items.map((it, idx) => (
            <li
              key={it.place_id || `${idx}`}
              role="option"
              aria-selected={highlight === idx}
              onMouseDown={(e) => {
                e.preventDefault();
                selectItem(it);
              }}
              onMouseEnter={() => setHighlight(idx)}
              className={`cursor-pointer p-2 truncate ${
                highlight === idx ? "bg-gray-100" : ""
              }`}
            >
              {it.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
