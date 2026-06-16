const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_IDLE_MS = 15 * 60 * 1000;

function startOfLocalDay(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** e.g. "Today at 8:42 AM", "Yesterday at 2:15 PM", "Monday at 9:00 AM" */
export function formatLastLoginLabel(
  timestampMs: number,
  nowMs: number = Date.now()
): string {
  const todayStart = startOfLocalDay(nowMs);
  const loginStart = startOfLocalDay(timestampMs);
  const diffDays = Math.round((todayStart - loginStart) / DAY_MS);

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampMs));

  if (diffDays === 0) return `Today at ${timeLabel}`;
  if (diffDays === 1) return `Yesterday at ${timeLabel}`;

  if (diffDays < 7) {
    const weekday = new Intl.DateTimeFormat(undefined, {
      weekday: "long",
    }).format(new Date(timestampMs));
    return `${weekday} at ${timeLabel}`;
  }

  const loginYear = new Date(timestampMs).getFullYear();
  const nowYear = new Date(nowMs).getFullYear();
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(loginYear !== nowYear ? { year: "numeric" as const } : {}),
  }).format(new Date(timestampMs));

  return `${dateLabel} at ${timeLabel}`;
}

export function formatSessionExpiresIn(
  lastActivityMs: number,
  idleMs: number = DEFAULT_IDLE_MS,
  nowMs: number = Date.now()
): string {
  if (!Number.isFinite(lastActivityMs) || lastActivityMs <= 0) {
    return "Unknown";
  }

  const remaining = idleMs - (nowMs - lastActivityMs);
  if (remaining <= 0) return "Expired";

  const totalMinutes = Math.ceil(remaining / (60 * 1000));
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${hours}h ${minutes}m`;
}
