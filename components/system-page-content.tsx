import type { ReactNode } from "react";

type SystemPageContentProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function SystemPageContent({
  title,
  description,
  children,
}: SystemPageContentProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-line bg-surface-elevated p-6 shadow-sm">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
      </div>
      {children ?? (
        <div className="grid gap-3 sm:grid-cols-2">
          <PlaceholderCard label="Summary" value="—" />
          <PlaceholderCard label="This week" value="—" />
          <PlaceholderCard label="Pending items" value="—" className="sm:col-span-2" />
        </div>
      )}
    </div>
  );
}

function PlaceholderCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-dashed border-line bg-primary-soft/30 px-4 py-6 ${className}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted">Connect your API to populate this view</p>
    </div>
  );
}
