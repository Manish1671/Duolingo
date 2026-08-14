"use client";

import { ButtonHTMLAttributes } from "react";

type Variant = "green" | "blue" | "red" | "outline";

export function DuoButton({
  variant = "green",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button className={`duo-btn duo-btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
