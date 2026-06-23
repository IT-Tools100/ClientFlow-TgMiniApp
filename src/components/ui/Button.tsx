import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

const variants = {
  primary:
    "bg-white text-slate-950 shadow-[0_16px_42px_rgba(96,165,250,0.26)] hover:-translate-y-0.5 hover:bg-slate-100 active:translate-y-0",
  secondary:
    "border border-white/[0.14] bg-white/10 text-white shadow-glow hover:-translate-y-0.5 hover:bg-white/[0.14] active:translate-y-0",
  ghost: "text-app-muted hover:bg-white/10 hover:text-white active:bg-white/[0.14]"
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
      className={`tap-highlight inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-45 ${variants[variant]} ${className}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
