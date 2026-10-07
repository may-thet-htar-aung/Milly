import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { useI18n } from "../i18n";
import { cn } from "../lib/utils";

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "outline" | "danger"; size?: "sm" | "md" | "lg" }) {
  return <button className={cn("button", `button-${variant}`, `button-${size}`, className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("input select", className)} {...props} />;
}

export function FormOptionMenu({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return <div className="sort-menu form-select-menu" ref={rootRef}>
    <button type="button" className="input select sort-menu-trigger" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((isOpen) => !isOpen)}>{current.label}</button>
    {open && <ul className="sort-menu-list" role="listbox">{options.map((option) => <li key={option.value}><button type="button" role="option" aria-selected={option.value === current.value} className="sort-menu-option" onClick={() => { onChange(option.value); setOpen(false); }}>{option.label}</button></li>)}</ul>}
  </div>;
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "amber" | "pink" }) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}

export function Spinner() {
  const { t } = useI18n();
  return <span className="spinner" aria-label={t("loading")} />;
}

export function ErrorState({ message }: { message?: string }) {
  const { t } = useI18n();
  return <div className="state state-error"><strong>{t("somethingWrong")}</strong><span>{message ?? t("loadFailed")}</span></div>;
}
