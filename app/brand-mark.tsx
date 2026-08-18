type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={`brand-symbol ${className}`.trim()}
      viewBox="0 0 40 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 4H38L33.5 10H5.5L10 4Z" fill="currentColor" />
      <path d="M6 13H32L27.5 19H1.5L6 13Z" fill="currentColor" />
      <path d="M4.5 22H25L20.5 28H0L4.5 22Z" fill="var(--lime)" />
    </svg>
  );
}
