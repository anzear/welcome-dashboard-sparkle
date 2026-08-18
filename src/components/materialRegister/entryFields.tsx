import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

export const LABEL = "text-[10px] font-semibold uppercase tracking-widest text-muted-foreground";

export const Field: React.FC<{
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ label, hint, required, children, className }) => (
  <label className={cn("block space-y-1", className)}>
    <span className={LABEL}>
      {label}
      {required && <span className="ml-1 text-primary">required</span>}
    </span>
    {children}
    {hint && <span className="block text-[10px] leading-tight text-muted-foreground">{hint}</span>}
  </label>
);

interface NumberFieldProps {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  hint?: string;
  computed?: boolean;
  overridden?: boolean;
  decimals?: number;
}

/**
 * Numeric input. An empty box is null, never 0. A computed value says so, and an
 * override flips it to entered and states that in place.
 */
export const NumberField: React.FC<NumberFieldProps> = ({
  label,
  value,
  onChange,
  unit,
  hint,
  computed,
  overridden,
}) => {
  const [text, setText] = useState<string>(value === null ? "" : String(value));
  const [dirty, setDirty] = useState(false);
  const shown = dirty ? text : value === null ? "" : String(value);

  return (
    <div className="space-y-1">
      <span className={LABEL}>
        {label}
        {unit && <span className="ml-1 font-normal normal-case tracking-normal opacity-70">{unit}</span>}
      </span>
      <Input
        value={shown}
        inputMode="decimal"
        placeholder="—"
        onChange={(e) => {
          setDirty(true);
          setText(e.target.value);
          const t = e.target.value.trim().replace(",", ".");
          if (t === "") return onChange(null);
          const n = Number(t);
          onChange(Number.isFinite(n) ? n : null);
        }}
        onBlur={() => setDirty(false)}
        className={cn(
          "h-7 text-[11px] tabular-nums",
          computed && !overridden && "border-dotted text-foreground/80",
        )}
      />
      {computed && !overridden && (
        <span className="block text-[10px] leading-tight text-muted-foreground">
          Computed from the figures above — overwrite to enter your own.
        </span>
      )}
      {computed && overridden && (
        <span className="block text-[10px] leading-tight text-primary/80">
          Overridden — now recorded as entered, not computed.
        </span>
      )}
      {hint && !computed && (
        <span className="block text-[10px] leading-tight text-muted-foreground">{hint}</span>
      )}
    </div>
  );
};

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  hint?: string;
}

/** Multi-select with free entry. Suggestions never restrict what can be typed. */
export const TagInput: React.FC<TagInputProps> = ({
  label,
  values,
  onChange,
  suggestions = [],
  placeholder = "Type and press Enter",
  hint,
}) => {
  const [draft, setDraft] = useState("");
  const matches = draft.trim()
    ? suggestions
        .filter((s) => s.toLowerCase().includes(draft.trim().toLowerCase()) && !values.includes(s))
        .slice(0, 6)
    : [];

  const add = (v: string) => {
    const t = v.trim();
    if (!t || values.includes(t)) return setDraft("");
    onChange([...values, t]);
    setDraft("");
  };

  return (
    <div className="space-y-1">
      <span className={LABEL}>{label}</span>
      <div className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-1.5 py-1">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]"
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              <X className="h-3 w-3 opacity-60 hover:opacity-100" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
            if (e.key === "Backspace" && draft === "" && values.length) onChange(values.slice(0, -1));
          }}
          onBlur={() => add(draft)}
          placeholder={values.length === 0 ? placeholder : ""}
          className="min-w-[7rem] flex-1 bg-transparent px-1 py-0.5 text-[11px] outline-none placeholder:text-muted-foreground/60"
        />
      </div>
      {matches.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-sm border border-dashed border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {hint && <span className="block text-[10px] leading-tight text-muted-foreground">{hint}</span>}
    </div>
  );
};

interface AutocompleteProps {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  suggestions: string[];
  placeholder?: string;
}

/** Free text with suggestions from values already in the register. */
export const AutocompleteField: React.FC<AutocompleteProps> = ({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}) => {
  const [focused, setFocused] = useState(false);
  const q = (value ?? "").trim().toLowerCase();
  const matches =
    focused && q
      ? suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q).slice(0, 6)
      : [];

  return (
    <div className="relative space-y-1">
      <span className={LABEL}>{label}</span>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        placeholder={placeholder}
        className="h-7 text-[11px]"
      />
      {matches.length > 0 && (
        <div className="absolute z-20 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {matches.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
                setFocused(false);
              }}
              className="block w-full px-2 py-1 text-left text-[11px] hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
