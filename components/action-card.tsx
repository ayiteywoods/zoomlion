import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import type { SystemStatus } from "@/lib/dashboard-data";

const statusConfig: Record<
  SystemStatus,
  { label: string; dot: string; badge: string }
> = {
  available: {
    label: "Available",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-800 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-amber-500",
    badge:
      "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-800/50",
  },
  new: {
    label: "New",
    dot: "bg-blue-500",
    badge: "bg-primary-soft text-primary-muted ring-line",
  },
};

type ActionCardVariant = "emerald" | "violet" | "amber" | "rose";

const cardBase =
  "border border-line bg-white shadow-[0_1px_3px_rgba(23,37,84,0.06),0_4px_12px_rgba(23,37,84,0.04)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(23,37,84,0.1)] dark:bg-surface-elevated";

const variantStyles: Record<
  ActionCardVariant,
  {
    iconBg: string;
    iconColor: string;
    accent: string;
    arrow: string;
    arrowHover: string;
    actionHover: string;
    ping: string;
    hoverIconBg: string;
    title: string;
    description: string;
    topBar: string;
    card: string;
    activeShadow: string;
  }
> = {
  emerald: {
    iconBg:
      "bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-800/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accent: "bg-emerald-500",
    arrow: "text-emerald-600 dark:text-emerald-400",
    arrowHover: "group-hover:bg-emerald-500 group-hover:ring-emerald-500",
    actionHover: "group-hover:text-emerald-700 dark:group-hover:text-emerald-400",
    ping: "bg-emerald-200/60 dark:bg-emerald-500/20",
    hoverIconBg:
      "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:ring-emerald-800/50",
    title: "text-emerald-800 dark:text-emerald-300",
    description: "text-muted",
    topBar: "bg-emerald-500",
    card: `${cardBase} hover:border-emerald-200 dark:hover:border-emerald-800/60`,
    activeShadow: "shadow-[0_8px_28px_rgba(16,185,129,0.18)]",
  },
  violet: {
    iconBg:
      "bg-violet-50 ring-1 ring-violet-100 dark:bg-violet-950/50 dark:ring-violet-800/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    accent: "bg-violet-500",
    arrow: "text-violet-600 dark:text-violet-400",
    arrowHover: "group-hover:bg-violet-500 group-hover:ring-violet-500",
    actionHover: "group-hover:text-violet-700 dark:group-hover:text-violet-400",
    ping: "bg-violet-200/60 dark:bg-violet-500/20",
    hoverIconBg:
      "bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-950/60 dark:text-violet-400 dark:ring-violet-800/50",
    title: "text-violet-800 dark:text-violet-300",
    description: "text-muted",
    topBar: "bg-violet-500",
    card: `${cardBase} hover:border-violet-200 dark:hover:border-violet-800/60`,
    activeShadow: "shadow-[0_8px_28px_rgba(139,92,246,0.18)]",
  },
  amber: {
    iconBg:
      "bg-amber-50 ring-1 ring-amber-100 dark:bg-amber-950/50 dark:ring-amber-800/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    accent: "bg-amber-500",
    arrow: "text-amber-600 dark:text-amber-400",
    arrowHover: "group-hover:bg-amber-500 group-hover:ring-amber-500",
    actionHover: "group-hover:text-amber-700 dark:group-hover:text-amber-400",
    ping: "bg-amber-200/60 dark:bg-amber-500/20",
    hoverIconBg:
      "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:ring-amber-800/50",
    title: "text-amber-800 dark:text-amber-300",
    description: "text-muted",
    topBar: "bg-amber-500",
    card: `${cardBase} hover:border-amber-200 dark:hover:border-amber-800/60`,
    activeShadow: "shadow-[0_8px_28px_rgba(245,158,11,0.18)]",
  },
  rose: {
    iconBg:
      "bg-rose-50 ring-1 ring-rose-100 dark:bg-rose-950/50 dark:ring-rose-800/40",
    iconColor: "text-rose-600 dark:text-rose-400",
    accent: "bg-rose-500",
    arrow: "text-rose-600 dark:text-rose-400",
    arrowHover: "group-hover:bg-rose-500 group-hover:ring-rose-500",
    actionHover: "group-hover:text-rose-700 dark:group-hover:text-rose-400",
    ping: "bg-rose-200/60 dark:bg-rose-500/20",
    hoverIconBg:
      "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:ring-rose-800/50",
    title: "text-rose-800 dark:text-rose-300",
    description: "text-muted",
    topBar: "bg-rose-500",
    card: `${cardBase} border-dashed hover:border-rose-200 hover:bg-rose-50/30 dark:hover:border-rose-800/60 dark:hover:bg-rose-950/20`,
    activeShadow: "shadow-[0_8px_28px_rgba(244,63,94,0.16)]",
  },
};

const activeBorderByVariant: Record<ActionCardVariant, string> = {
  emerald: "border-emerald-500",
  violet: "border-violet-500",
  amber: "border-amber-500",
  rose: "border-rose-500 border-dashed",
};

const logoAnimationByVariant: Record<ActionCardVariant, string> = {
  emerald: "animate-logo-float",
  violet: "animate-logo-breathe",
  amber: "animate-logo-float-slow",
  rose: "",
};

type ActionCardProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  logoSrc?: string;
  logoAlt?: string;
  logoImageClassName?: string;
  hoverIcon?: ReactNode;
  variant: ActionCardVariant;
  href?: string;
  external?: boolean;
  status?: SystemStatus;
  isPrimary?: boolean;
  actionLabel?: string;
  animationDelay?: number;
  isActive?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onLaunch?: () => void;
  launchDisabled?: boolean;
};

export function ActionCard({
  title,
  description,
  icon,
  logoSrc,
  logoAlt,
  logoImageClassName,
  hoverIcon,
  variant,
  href = "#",
  external = false,
  status = "available",
  isPrimary = false,
  actionLabel = "Go to system",
  animationDelay = 0,
  isActive = false,
  onHoverStart,
  onHoverEnd,
  onLaunch,
  launchDisabled = false,
}: ActionCardProps) {
  const styles = variantStyles[variant];
  const showHoverBadge = Boolean(hoverIcon);
  const hoverBadgeVisible = isActive ? "opacity-100 scale-100" : "opacity-0 scale-90";
  const statusStyle = statusConfig[status];

  const linkClassName = `group animate-fade-in-up relative flex h-full min-h-[250px] w-full flex-col overflow-visible rounded-lg px-4 pb-3 pt-4 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:min-h-[270px] sm:px-5 sm:pb-4 sm:pt-5 ${styles.card} ${
    isActive
      ? `-translate-y-0.5 ${styles.activeShadow} ${activeBorderByVariant[variant]}`
      : ""
  }`;

  const linkProps = {
    "aria-label": `${actionLabel} — ${title}`,
    style: { animationDelay: `${animationDelay}ms` },
    onMouseEnter: onHoverStart,
    onMouseLeave: onHoverEnd,
    onFocus: onHoverStart,
    onBlur: onHoverEnd,
    className: linkClassName,
  };

  const cardContent = (
    <>
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${statusStyle.badge}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
              aria-hidden
            />
            {statusStyle.label}
          </span>
          {isPrimary && (
            <span className="rounded-full bg-brand-950 px-2 py-0.5 text-[10px] font-semibold text-white">
              Primary
            </span>
          )}
        </div>
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-lg ${styles.topBar}`}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="group-hover:animate-shimmer-sweep absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {showHoverBadge && (
          <div
            className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-md ring-1 ring-line transition-all duration-300 ease-out group-hover:opacity-100 group-hover:animate-bounce-soft group-hover:-rotate-6 sm:h-11 sm:w-11 ${styles.hoverIconBg} ${hoverBadgeVisible} ${isActive ? "animate-bounce-soft -rotate-6 opacity-100 scale-100" : "group-hover:scale-110"}`}
            aria-hidden
          >
            <span className="inline-flex [&_svg]:h-5 [&_svg]:w-5 sm:[&_svg]:h-6 sm:[&_svg]:w-6">
              {hoverIcon}
            </span>
          </div>
        )}

        <div className="flex w-full flex-1 flex-col items-center justify-center px-0.5 pb-2 pt-7 sm:pt-8">
        <div className="relative mb-3 shrink-0">
          {!logoSrc && (
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <span
                className={`animate-ping-slow absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-40 ${styles.ping}`}
                aria-hidden
              />
              <div
                className={`relative flex h-full w-full items-center justify-center rounded-xl transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-lg ${styles.iconBg} ${styles.iconColor}`}
              >
                <span className="inline-flex transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 group-hover:animate-bounce-soft">
                  {icon}
                </span>
              </div>
            </div>
          )}

          {logoSrc && (
            <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32 lg:h-36 lg:w-36">
              <span
                className={`animate-logo-glow absolute inset-0 rounded-full ${styles.ping}`}
                aria-hidden
              />
              <span
                className={`animate-ping-slow absolute inset-1 rounded-full opacity-25 ${styles.ping}`}
                aria-hidden
              />
              <div
                className={`relative h-full w-full transition-transform duration-500 ease-out group-hover:scale-110 ${logoAnimationByVariant[variant]} ${isActive ? "scale-110" : ""}`}
                style={{ animationDelay: `${(animationDelay % 400) + 200}ms` }}
              >
                {logoSrc.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt={logoAlt ?? title}
                    className={`h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(23,37,84,0.15)] transition-all duration-300 group-hover:drop-shadow-[0_12px_28px_rgba(23,37,84,0.22)] ${logoImageClassName ?? ""}`}
                  />
                ) : (
                  <Image
                    src={logoSrc}
                    alt={logoAlt ?? title}
                    width={160}
                    height={160}
                    className={`h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(23,37,84,0.15)] transition-all duration-300 group-hover:drop-shadow-[0_12px_28px_rgba(23,37,84,0.22)] ${logoImageClassName ?? ""}`}
                    priority={variant === "emerald"}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <h2
          className={`relative text-sm font-semibold tracking-tight transition-colors duration-200 sm:text-base ${styles.title}`}
        >
          {title}
        </h2>
        <div
          className={`relative my-2 h-0.5 w-8 origin-center rounded-full transition-all duration-300 group-hover:w-10 ${styles.accent}`}
        />
        <p
          className={`relative line-clamp-3 max-w-[18rem] text-[11px] leading-4 sm:text-xs sm:leading-5 ${styles.description}`}
        >
          {description}
        </p>
        </div>

        <div className="mt-auto flex w-full items-center justify-end gap-2.5 border-t border-line/80 pt-3">
          <span
            className={`text-xs font-medium text-muted transition-colors duration-300 ${styles.actionHover}`}
          >
            {actionLabel}
          </span>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft ring-1 ring-line transition-all duration-300 ease-out group-hover:shadow-md ${styles.arrow} ${styles.arrowHover}`}
            aria-hidden
          >
            <ArrowRightIcon
              className={`h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:text-white ${styles.arrow}`}
            />
          </span>
        </div>
    </>
  );

  if (onLaunch) {
    return (
      <div className="h-full p-1">
        <button
          type="button"
          {...linkProps}
          disabled={launchDisabled}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!launchDisabled) onLaunch();
          }}
          className={`${linkClassName} w-full cursor-pointer border-0 bg-transparent p-0 text-left disabled:cursor-wait disabled:opacity-80`}
        >
          {cardContent}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full p-1">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
          {cardContent}
        </a>
      ) : (
        <Link href={href} {...linkProps}>
          {cardContent}
        </Link>
      )}
    </div>
  );
}
