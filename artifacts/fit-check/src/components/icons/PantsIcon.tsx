import { SVGProps } from "react";

export function PantsIcon({ className, ...props }: SVGProps<SVGSVGElement> & { className?: string }) {
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
      <path d="M4 4h16" />
      <path d="M4 4l2 16H10l2-7 2 7h4l2-16" />
    </svg>
  );
}
