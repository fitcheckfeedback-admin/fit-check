import { SVGProps } from "react";

export function JacketIcon({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M3 9L6 4L9 6L12 5L15 6L18 4L21 9L18 11V21H6V11L3 9Z" />
      <path d="M9 6L12 10L15 6" />
      <path d="M12 10V21" />
    </svg>
  );
}
