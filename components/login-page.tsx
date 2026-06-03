"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ComponentType, type FormEvent, type KeyboardEventHandler, type ReactNode } from "react";
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import BrandedLoader from "@/components/branded-loader";
import {
  extractAuthUser,
  getLoginErrorMessage,
  type LoginSuccessResponse,
} from "@/lib/auth-api";
import { resolvePostLoginPath } from "@/lib/auth-redirect";
import { setAuthenticated } from "@/lib/auth";
import { saveAuthCredentials } from "@/lib/auth-credentials";

const LOGIN_BG_CYCLE_S = 24;
const LOGIN_BG_SLOTS = 8;
const LOGIN_BG_SLOT_S = LOGIN_BG_CYCLE_S / LOGIN_BG_SLOTS;

const connectedSystemLogos = [
  { src: "/zl.png", alt: "Zoomlion", label: "iWaste" },
  { src: "/zl.png", alt: "Zoomlion", label: "Corporate" },
  { src: "/zl.png", alt: "Zoomlion", label: "SIP" },
] as const;

const connectedSystemLogoImageClass =
  "h-7 w-auto max-w-full object-contain object-center";

const connectedSystemLogoTileClass =
  "flex h-11 w-[4.25rem] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-1.5 dark:border-slate-700 dark:bg-slate-900";

const loginBgLogoFrameClass =
  "relative z-10 flex h-[44%] max-h-14 w-[62%] max-w-[4.5rem] items-center justify-center sm:max-h-16 sm:max-w-[5.25rem]";

const loginBgLogoImageClass =
  "h-full w-auto max-w-full object-contain object-center opacity-90 drop-shadow-[0_4px_16px_rgba(0,0,0,0.2)]";

const loginParticles = [
  { top: "14%", left: "20%", delay: "0s", duration: "18s", size: "h-1 w-1" },
  { top: "62%", left: "14%", delay: "4s", duration: "22s", size: "h-1 w-1" },
  { top: "78%", left: "72%", delay: "1s", duration: "20s", size: "h-1 w-1" },
  { top: "8%", left: "58%", delay: "3s", duration: "21s", size: "h-1 w-1" },
  { top: "52%", left: "6%", delay: "7s", duration: "23s", size: "h-0.5 w-0.5" },
] as const;

const loginHeroEyebrowClass =
  "zl-login-hero-text-eyebrow bg-gradient-to-r from-brand-300/85 via-brand-200/75 to-brand-400/80 bg-clip-text text-[10px] font-semibold uppercase tracking-[0.28em] text-transparent sm:text-[11px]";

const loginHeroTitleClass =
  "zl-login-hero-text-title block bg-gradient-to-r from-white via-white to-brand-100 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl lg:text-[3.25rem] lg:leading-none";

const loginHeroSubtitleClass =
  "zl-login-hero-text-subtitle mt-2 block whitespace-nowrap bg-gradient-to-r from-brand-200 via-sky-100 to-brand-300 bg-clip-text text-[clamp(0.875rem,3.2vw,1.875rem)] font-semibold leading-none tracking-tight text-transparent sm:mt-3";

const loginHeroTaglineClass =
  "mx-auto mt-4 max-w-md text-sm leading-relaxed text-brand-200/90 sm:text-[15px] lg:mx-0 lg:mt-5 lg:text-base";

const loginHeroAccentLineClass =
  "zl-login-hero-accent mx-auto mt-5 h-px w-20 bg-gradient-to-r from-transparent via-brand-400/45 to-transparent sm:w-24 lg:mx-0 lg:w-32";

const loginLabelClass =
  "mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300";

const loginInputClass =
  "w-full rounded-lg border border-line bg-primary-soft py-3 pl-11 pr-4 text-[15px] text-brand-950 outline-none transition duration-200 placeholder:text-brand-800/30 focus:border-brand-600 focus:bg-blue-50 focus:ring-[3px] focus:ring-brand-600/15 dark:border-brand-800/55 dark:bg-brand-950/30 dark:text-slate-100 dark:placeholder:text-brand-300/35 dark:focus:border-brand-500 dark:focus:bg-brand-950/45 dark:focus:ring-brand-500/20";

type LoginFieldProps = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete: string;
  icon: ComponentType<{ className?: string }>;
  inputMode?: "text" | "tel" | "email";
  trailing?: ReactNode;
  inputClassName?: string;
  labelAction?: ReactNode;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
};

function LoginField({
  id,
  name,
  label,
  type,
  placeholder,
  autoComplete,
  icon: Icon,
  inputMode,
  trailing,
  inputClassName = "",
  labelAction,
  onKeyDown,
}: LoginFieldProps) {
  return (
    <div className="group">
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className={`${loginLabelClass} mb-0`}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <Icon
          className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand-600 dark:text-slate-500 dark:group-focus-within:text-brand-400"
          aria-hidden
        />
        <input
          id={id}
          name={name}
          type={type}
          required
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onKeyDown={onKeyDown}
          className={`${loginInputClass} ${trailing ? "pr-11" : ""} ${inputClassName}`}
        />
        {trailing}
      </div>
    </div>
  );
}

type LoginBgRingProps = {
  className: string;
  slot: number;
  icon?: ComponentType<{ className?: string }>;
  iconClassName?: string;
  logoSrc?: string;
  logoAlt?: string;
};

function LoginBgRing({
  className,
  slot,
  icon: Icon,
  iconClassName = "h-[48%] w-[48%] text-brand-300/35 [&_path]:stroke-[1.25]",
  logoSrc,
  logoAlt,
}: LoginBgRingProps) {
  const animationDelay = `${slot * LOGIN_BG_SLOT_S}s`;

  return (
    <div
      className={`absolute flex items-center justify-center zl-login-icon-cycle ${className}`}
      style={{ animationDelay }}
    >
      <div className="relative flex h-full w-full items-center justify-center">
        <span
          className="absolute inline-flex h-full w-full rounded-full border border-brand-400/25 zl-login-ring-cycle"
          style={{ animationDelay }}
        />
        <span className="absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-300/20" />
        {logoSrc ? (
          <div className={loginBgLogoFrameClass}>
            <Image
              src={logoSrc}
              alt={logoAlt ?? ""}
              width={160}
              height={64}
              className={loginBgLogoImageClass}
            />
          </div>
        ) : Icon ? (
          <Icon className={`relative z-10 ${iconClassName}`} />
        ) : null}
      </div>
    </div>
  );
}

function LoginBgCenter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
}

function LoginBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-950 to-brand-900" />
      <div className="zl-login-bg-drift absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(59,130,246,0.14),transparent_55%)]" />
      <div className="zl-login-bg-drift-alt absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_100%,rgba(37,99,235,0.12),transparent_50%)]" />
      <div className="zl-login-grid-breathe absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(147,197,253,0.12)_1px,transparent_0)] bg-[size:28px_28px] opacity-70 mix-blend-overlay" />

      <div className="zl-login-bg-drift absolute -left-16 top-[18%] h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
      <div className="zl-login-bg-drift-alt absolute -right-20 bottom-[12%] h-80 w-80 rounded-full bg-brand-400/10 blur-3xl" />
      <div className="zl-login-bg-drift absolute left-[30%] top-[55%] h-56 w-56 rounded-full bg-brand-600/8 blur-3xl [animation-delay:4s]" />

      <LoginBgCenter>
        <div className="zl-login-center-pulse h-[min(90vw,640px)] w-[min(90vw,640px)] rounded-full border border-brand-400/15" />
      </LoginBgCenter>

      <LoginBgCenter>
        <div className="zl-login-orbit-spin h-[min(78vw,560px)] w-[min(78vw,560px)] rounded-full border border-dashed border-brand-400/12" />
      </LoginBgCenter>

      <LoginBgCenter>
        <div className="zl-login-orbit-spin-reverse h-[min(66vw,480px)] w-[min(66vw,480px)] rounded-full border border-brand-300/10" />
      </LoginBgCenter>

      <LoginBgCenter>
        <svg
          className="zl-login-orbit-spin h-[min(95vw,680px)] w-[min(95vw,680px)] [animation-duration:140s]"
          viewBox="0 0 400 400"
          fill="none"
        >
          <circle
            cx="200"
            cy="200"
            r="188"
            className="zl-login-arc-dash text-brand-400/30"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            d="M 200 24 A 176 176 0 0 1 352 200"
            className="zl-login-arc-dash text-brand-300/35 [animation-duration:28s]"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <path
            d="M 48 200 A 176 176 0 0 1 200 376"
            className="zl-login-arc-dash text-brand-500/30 [animation-duration:32s] [animation-direction:reverse]"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </LoginBgCenter>

      {loginParticles.map((particle, index) => (
        <span
          key={index}
          className={`zl-login-particle absolute ${particle.size} rounded-full bg-brand-300/60 shadow-[0_0_10px_rgba(147,197,253,0.45)]`}
          style={{
            top: particle.top,
            left: particle.left,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}

      <div className="absolute inset-0 overflow-hidden opacity-80">
        <div className="zl-login-scan-sweep absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent via-brand-400/15 to-transparent" />
      </div>

      <div className="absolute left-0 top-[22%] h-px w-2/5 overflow-hidden bg-brand-400/10">
        <div className="zl-login-shimmer-x h-full w-1/2 bg-gradient-to-r from-transparent via-brand-300/35 to-transparent" />
      </div>
      <div className="absolute bottom-[30%] right-0 h-px w-1/3 overflow-hidden bg-brand-400/8">
        <div className="zl-login-shimmer-x h-full w-1/2 bg-gradient-to-r from-transparent via-brand-300/30 to-transparent [animation-delay:2s]" />
      </div>

      <LoginBgRing
        slot={0}
        className="left-[5%] top-[10%] h-36 w-36 sm:h-44 sm:w-44"
        icon={ArrowPathIcon}
      />

      <LoginBgRing
        slot={1}
        className="bottom-[10%] right-[6%] h-40 w-40 sm:h-48 sm:w-48"
        icon={GlobeAltIcon}
        iconClassName="h-[48%] w-[48%] text-brand-300/30 [&_path]:stroke-[1.25]"
      />

      <LoginBgRing
        slot={2}
        className="bottom-[8%] left-[8%] h-36 w-36 sm:h-44 sm:w-44"
        icon={TrashIcon}
        iconClassName="h-[48%] w-[48%] -rotate-6 text-brand-300/30 [&_path]:stroke-[1.25]"
      />

      <LoginBgRing
        slot={3}
        className="right-[7%] top-[14%] h-52 w-52 sm:h-64 sm:w-64"
      />

      <LoginBgRing
        slot={4}
        className="left-[18%] top-[28%] h-44 w-44 sm:h-56 sm:w-56"
      />

      <LoginBgRing
        slot={5}
        className="left-1/2 top-[6%] h-40 w-40 -translate-x-1/2 sm:h-48 sm:w-48"
        logoSrc="/zl.png"
        logoAlt="Zoomlion"
      />

      <LoginBgRing
        slot={6}
        className="right-[4%] top-[42%] h-40 w-40 sm:h-48 sm:w-48"
        logoSrc="/zl.png"
        logoAlt="Zoomlion"
      />

      <LoginBgRing
        slot={7}
        className="left-[4%] top-[42%] h-40 w-40 sm:h-48 sm:w-48"
        logoSrc="/zl.png"
        logoAlt="Zoomlion"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-brand-950/20 via-transparent to-brand-950/40" />
    </div>
  );
}

export function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = resolvePostLoginPath(searchParams.get("from"));

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoggingIn) return;

    const form = e.currentTarget;
    const identifier = (
      form.elements.namedItem("identifier") as HTMLInputElement
    ).value.trim();
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    setError(null);
    setIsLoggingIn(true);

    try {
      const body = new FormData();
      body.append("phone_no", identifier);
      body.append("username", identifier);
      body.append("password", password);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        body,
        redirect: "manual",
      });

      if (response.type === "opaqueredirect" || response.status === 0) {
        setError(
          "Login service unavailable. Please refresh and try again."
        );
        return;
      }

      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(getLoginErrorMessage(payload));
        return;
      }

      const loginResponse = payload as LoginSuccessResponse;
      const user = extractAuthUser(loginResponse);
      setAuthenticated(true, loginResponse);
      const profileEmail =
        user?.email?.trim() ||
        (user?.username?.includes("@") ? user.username.trim() : undefined);

      saveAuthCredentials(
        identifier,
        password,
        profileEmail ?? user?.phone_no?.trim() ?? identifier,
        profileEmail ?? (identifier.includes("@") ? identifier : undefined)
      );
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-brand-950">
      {isLoggingIn && <BrandedLoader fullscreen />}

      <LoginBackground />

      <div className="relative z-10 flex justify-center pt-5 lg:hidden">
        <Image
          src="/zl.png"
          alt="Zoomlion"
          width={120}
          height={48}
          className="h-9 w-auto object-contain opacity-95"
          priority
        />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 sm:py-8">
        <div className="flex w-full max-w-6xl flex-col items-center gap-8 sm:gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16 xl:gap-24">
          <div className="animate-fade-in-up order-1 w-full max-w-md shrink-0 [animation-delay:120ms] lg:order-2">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/95 p-7 shadow-[0_8px_32px_rgba(15,23,42,0.14),0_24px_56px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-8 dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-black/40">
              <div
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-800 via-brand-600 to-brand-500"
                aria-hidden
              />

              <div
                className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-primary-soft/90 px-2.5 py-1 ring-1 ring-line dark:bg-brand-950/70 dark:ring-brand-800/55"
                aria-label="Secure sign-in"
              >
                <ShieldCheckIcon
                  className="h-3.5 w-3.5 shrink-0 text-brand-700 dark:text-brand-400"
                  aria-hidden
                />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-800 dark:text-brand-300">
                  Secure
                </span>
              </div>

              <div className="relative border-b border-slate-100 pb-5 pt-0.5 dark:border-slate-800">
                <div className="hidden justify-center lg:flex lg:justify-start">
                  <Image
                    src="/zl.png"
                    alt=""
                    width={112}
                    height={44}
                    className="h-9 w-auto object-contain"
                    priority
                    aria-hidden
                  />
                </div>

                <h2 className="mt-3 text-center text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50 lg:mt-4 lg:text-left">
                  Welcome back
                </h2>
                <p className="mt-1.5 text-center text-sm leading-relaxed text-slate-600 dark:text-slate-400 lg:text-left">
                  Sign in to access your connected system.
                </p>
                {searchParams.get("reason") === "idle" && (
                  <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-center text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-100">
                    Your session expired after 6 hours of inactivity. Please sign
                    in again.
                  </p>
                )}
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5 pt-5">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-100"
                  >
                    <ExclamationCircleIcon
                      className="mt-0.5 h-[18px] w-[18px] shrink-0 text-rose-600 dark:text-rose-400"
                      aria-hidden
                    />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <LoginField
                    id="login-identifier"
                    name="identifier"
                    label="Phone or email"
                    type="text"
                    placeholder="Phone number or email"
                    autoComplete="username"
                    inputMode="text"
                    icon={UserIcon}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        document.getElementById("password")?.focus();
                      }
                    }}
                  />

                  <LoginField
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    icon={LockClosedIcon}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoggingIn) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    labelAction={
                      <Link
                        href="/reset-password"
                        className="text-xs font-medium text-brand-700 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Forgot password?
                      </Link>
                    }
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-brand-700/45 transition-colors hover:bg-blue-50 hover:text-brand-800 dark:text-brand-400/55 dark:hover:bg-brand-900/60 dark:hover:text-brand-300"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        aria-pressed={showPassword}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-[18px] w-[18px]" aria-hidden />
                        ) : (
                          <EyeIcon className="h-[18px] w-[18px]" aria-hidden />
                        )}
                      </button>
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-800 via-brand-700 to-brand-600 px-4 text-sm font-semibold text-white shadow-md shadow-brand-950/25 transition hover:from-brand-700 hover:via-brand-600 hover:to-brand-500 focus:outline-none focus:ring-[3px] focus:ring-brand-600/30 disabled:opacity-70"
                >
                  {isLoggingIn ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden />
                  )}
                  {isLoggingIn ? "Signing in..." : "Sign in"}
                </button>

                <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Connected systems
                  </p>
                  <div className="mt-3 flex items-start justify-center gap-4 sm:gap-5">
                    {connectedSystemLogos.map((system) => (
                      <div
                        key={system.label}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div
                          className={connectedSystemLogoTileClass}
                          title={system.label}
                        >
                          <Image
                            src={system.src}
                            alt={`${system.label} — Zoomlion`}
                            width={80}
                            height={28}
                            className={connectedSystemLogoImageClass}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {system.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
          </div>

          <header className="animate-fade-in-up order-2 max-w-xl text-center lg:order-1 lg:max-w-2xl lg:flex-1 lg:text-left xl:max-w-3xl [animation-delay:220ms]">
            <p className={loginHeroEyebrowClass}>Enterprise access portal</p>
            <h1 className="mt-3 sm:mt-4">
              <span className={loginHeroTitleClass}>Zoomlion</span>
              <span className={loginHeroSubtitleClass}>
                Consolidated Application Systems
              </span>
            </h1>
            <p className={loginHeroTaglineClass}>
              Single sign-on to iWaste, Corporate, and SIP — your operations
              hub in one place.
            </p>
            <div className={loginHeroAccentLineClass} aria-hidden />
          </header>
        </div>
      </div>

      <footer className="relative z-10 shrink-0 border-t border-brand-800/50 bg-brand-950/70 px-4 py-3.5 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-[11px] text-brand-300/70 sm:flex-row sm:text-xs">
          <p>© {new Date().getFullYear()} Zoomlion Waste Management</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a
              href="https://nerasolgh.com/index.php/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-brand-200"
            >
              Privacy
            </a>
            <a
              href="https://helpdesk.nerasolgh.com/tickets/create"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-brand-200"
            >
              Support
            </a>
            <span className="hidden text-brand-500/40 sm:inline" aria-hidden>
              |
            </span>
            <span className="text-brand-300/55">Powered by Nerasol Ghana</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
