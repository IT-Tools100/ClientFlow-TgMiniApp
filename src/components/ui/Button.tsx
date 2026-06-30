import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variants = {
  primary:
    "border border-white/80 bg-white text-slate-950 shadow-[0_16px_42px_rgba(96,165,250,0.24)] hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0",
  secondary:
    "border border-white/[0.16] bg-white/[0.095] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.14] active:translate-y-0",
  ghost:
    "border border-transparent text-app-muted hover:border-white/10 hover:bg-white/[0.08] hover:text-white active:bg-white/[0.13]",
  danger:
    "border border-accent-red/35 bg-accent-red/[0.14] text-rose-50 hover:-translate-y-0.5 hover:bg-accent-red/[0.20] active:translate-y-0"
};

export function Button({
  children,
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`tap-highlight inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold leading-none transition duration-200 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45 ${variants[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
