import type { ReactNode } from "react";

export type WorkoutIconId = "A" | "B" | "C" | "EXPRESS" | "RUN";

export function RoutineIcon({ id, className = "" }: { id: WorkoutIconId; className?: string }) {
  const paths: Record<WorkoutIconId, ReactNode> = {
    A: <><path d="M5 8v8M8 6v12M16 6v12M19 8v8M8 12h8" /></>,
    B: <><path d="M4 18 9 7l5 10 6-12" /><path d="M3 18h18" /></>,
    C: <><path d="M4 19 12 5l8 14" /><path d="M8 14h8" /></>,
    EXPRESS: <><path d="m13 3-7 11h6l-1 7 7-11h-6l1-7Z" /></>,
    RUN: <><circle cx="15.5" cy="4.5" r="1.7" fill="currentColor" stroke="none" /><path d="m13.5 7.5-3 4.7M13 8l4 2 3-1M12 9l-3.5 1.5M10.5 12.2l4.5 3 1.8 4.4M10.5 12.2 8 16l-4.5 2.2" /></>,
  };

  return (
    <svg aria-hidden="true" className={`routine-icon ${className}`.trim()} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[id]}</g>
    </svg>
  );
}

export function ArrowIcon({ direction = "right", className = "" }: { direction?: "right" | "up-right"; className?: string }) {
  return (
    <svg aria-hidden="true" className={`ui-arrow ${className}`.trim()} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {direction === "up-right" ? (
        <path d="M5 15 15 5M9 5h6v6" />
      ) : (
        <path d="M3.5 10h12M11.5 6l4 4-4 4" />
      )}
    </svg>
  );
}
