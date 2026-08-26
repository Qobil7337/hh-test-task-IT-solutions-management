// Campaigns have no image field in the API yet, so each campaign gets a
// deterministic illustration derived from its id (no external requests).
function hueFromId(id: string): number {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

export function CampaignImage({
  id,
  title,
  className = "",
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const hue = hueFromId(id);
  return (
    <div
      role="img"
      aria-label={`Illustration for ${title}`}
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 55% 88%), hsl(${(hue + 40) % 360} 60% 72%))`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-14 w-14 text-white/80 drop-shadow-sm"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  );
}
