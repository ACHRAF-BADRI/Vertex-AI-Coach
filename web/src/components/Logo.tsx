import { useId } from "react";

export default function Logo({ size = 24, className = "" }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="11" fill={`url(#${id})`} />
      <path d="M9 12h9l6 17 6-17h9L28 39h-8Z" fill="#fff" />
      <path d="M24 29l6-17h-5.2Z" fill="#fff" fillOpacity=".35" />
    </svg>
  );
}
