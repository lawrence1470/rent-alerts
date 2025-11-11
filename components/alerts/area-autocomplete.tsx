"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  searchNeighborhoods,
  getNeighborhoodByValue,
  parseAreasString,
  formatAreasString,
  type Neighborhood,
} from "@/lib/constants/nyc-areas";

interface AreaAutocompleteProps {
  value: string; // comma-separated string
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function AreaAutocomplete({
  value,
  onChange,
  error,
  disabled,
}: AreaAutocompleteProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Neighborhood[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const suggestionsRef = React.useRef<HTMLDivElement>(null);

  // Parse selected areas from value string
  const selectedAreas = React.useMemo(() => {
    if (!value) return [];
    return parseAreasString(value);
  }, [value]);

  // Get neighborhood objects for selected areas
  const selectedNeighborhoods = React.useMemo(() => {
    return selectedAreas
      .map((area) => getNeighborhoodByValue(area))
      .filter(Boolean) as Neighborhood[];
  }, [selectedAreas]);

  // Update suggestions when input changes
  React.useEffect(() => {
    if (inputValue.trim()) {
      const results = searchNeighborhoods(inputValue);
      // Filter out already selected neighborhoods
      const filtered = results.filter(
        (n) => !selectedAreas.includes(n.value)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
      setFocusedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setFocusedIndex(-1);
    }
  }, [inputValue, selectedAreas]);

  // Handle click outside to close suggestions
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addArea = (neighborhood: Neighborhood) => {
    const newAreas = [...selectedAreas, neighborhood.value];
    onChange(formatAreasString(newAreas));
    setInputValue("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeArea = (areaValue: string) => {
    const newAreas = selectedAreas.filter((a) => a !== areaValue);
    onChange(formatAreasString(newAreas));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !inputValue && selectedAreas.length > 0) {
      // Remove last selected area on backspace when input is empty
      removeArea(selectedAreas[selectedAreas.length - 1]);
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      addArea(suggestions[focusedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected areas as tags */}
      {selectedNeighborhoods.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNeighborhoods.map((neighborhood) => (
            <Badge
              key={neighborhood.value}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {neighborhood.label}
              <button
                type="button"
                onClick={() => removeArea(neighborhood.value)}
                disabled={disabled}
                className="ml-1 rounded-sm hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                aria-label={`Remove ${neighborhood.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={
            selectedAreas.length === 0
              ? "Search neighborhoods (e.g., Williamsburg, SoHo)..."
              : "Add more neighborhoods..."
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? "area-error" : undefined}
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
          >
            <div className="max-h-60 overflow-y-auto p-1">
              {suggestions.map((neighborhood, index) => (
                <button
                  key={neighborhood.value}
                  type="button"
                  onClick={() => addArea(neighborhood)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-3 py-2 text-sm outline-none transition-colors",
                    focusedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                >
                  <span>{neighborhood.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {neighborhood.borough}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results message */}
        {showSuggestions && inputValue && suggestions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-md">
            No neighborhoods found
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p id="area-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && selectedAreas.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Start typing to search NYC neighborhoods
        </p>
      )}
    </div>
  );
}
