import { ReactNode } from "react";

interface SectionTitleProps {
  children: ReactNode;
  /** Title text size — defaults to the standard screen-title size. */
  className?: string;
}

/**
 * Solid screen title with a short rounded orange underline accent.
 * Replaces the old two-tone split-syllable treatment (first syllable in
 * gradient orange), which read as a rendering glitch.
 */
export function SectionTitle({ children, className = "text-4xl" }: SectionTitleProps) {
  return (
    <h1 className={`font-display font-bold text-foreground ${className}`}>
      {children}
      <span
        aria-hidden
        className="mt-1.5 block h-1.5 w-12 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
      />
    </h1>
  );
}
