import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
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

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "green" | "amber" | "pink" }) {
  return <span className={cn("badge", `badge-${tone}`)}>{children}</span>;
}

export function Spinner() { return <span className="spinner" aria-label="Loading" />; }

export function ErrorState({ message = "We couldn't load this right now." }: { message?: string }) {
  return <div className="state state-error"><strong>Something went wrong</strong><span>{message}</span></div>;
}
