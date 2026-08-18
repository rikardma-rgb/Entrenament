import type { ReactNode } from "react";

export type WorkoutIconId = "A" | "B" | "C" | "EXPRESS" | "RUN";

export function RoutineIcon({ id, className = "" }: { id: WorkoutIconId; className?: string }) {
  const paths: Record<WorkoutIconId, ReactNode> = {
    A: <><path d="M5 8v8M8 6v12M16 6v12M19 8v8M8 12h8" /></>,
    B: <><path d="M4 18 9 7l5 10 6-12" /><path d="M3 18h18" /></>,
    C: <><path d="M4 19 12 5l8 14" /><path d="M8 14h8" /></>,
    EXPRESS: <><path d="m13 3-7 11h6l-1 7 7-11h-6l1-7Z" /></>,
    RUN: <><path d="M5 18c-1.8-1.8-2-5.7-.4-8.2C6.1 7.4 8.4 6 11 6h7" /><path d="M8 18c-1.3-1.2-1.4-3.8-.3-5.4.9-1.4 2.3-2.1 4.1-2.1H19" /><path d="m16 3 3 3-3 3" /></>,
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
