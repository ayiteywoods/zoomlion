import { systemHealthItems, type HealthState } from "@/lib/dashboard-data";

const stateStyles: Record<
  HealthState,
  { dot: string; text: string }
> = {
  operational: {
    dot: "bg-brand-600",
    text: "text-brand-700 dark:text-brand-300",
  },
  degraded: {
    dot: "bg-brand-500",
    text: "text-brand-800 dark:text-brand-300",
  },
  maintenance: {
    dot: "bg-brand-300",
    text: "text-brand-800/75 dark:text-brand-300/80",
  },
};

export function SystemHealthStrip() {
  const hasIssue = systemHealthItems.some(
    (item) => item.state !== "operational"
  );

  return (
    <section
      aria-label="System status"
      className="animate-fade-in shrink-0 border-b border-line bg-surface-elevated px-4 py-2 lg:px-8 [animation-delay:240ms]"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-muted">
          {hasIssue ? "System status" : "All systems operational"}
        </p>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {systemHealthItems.map((item) => {
            const style = stateStyles[item.state];
            return (
              <li
                key={item.id}
                className="flex items-center gap-1.5 text-xs"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                  aria-hidden
                />
                <span className="font-medium text-brand-950 dark:text-primary">
                  {item.label}
                </span>
                <span className="text-brand-500/45 dark:text-brand-300/35" aria-hidden>
                  ·
                </span>
                <span className={style.text}>{item.message}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
