"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import BrandedLoader from "@/components/branded-loader";
import { getAuthCredentials, resolveSipEmail } from "@/lib/auth-credentials";
import {
  getSystemLaunchConfig,
  isExternalSystemId,
} from "@/lib/system-launch";

type AccessResponse =
  | {
      ok: true;
      redirectUrl: string;
      launchMode?: "gateway" | "form";
      label: string;
    }
  | {
      ok: false;
      loginUrl: string;
      message?: string;
    };

function submitSessionForm(
  sessionUrl: string,
  phone: string,
  password: string,
  target: "_blank" | "_self" = "_blank",
  corporateLoginId?: string,
  sipEmail?: string
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = sessionUrl;
  form.target = target;
  form.style.display = "none";

  const fields: [string, string][] = [
    ["phone", phone],
    ["password", password],
  ];
  if (corporateLoginId) {
    fields.push(["corporate_login_id", corporateLoginId]);
  }
  if (sipEmail) {
    fields.push(["sip_email", sipEmail]);
  }

  for (const [name, value] of fields) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

export default function SystemLaunchPage() {
  const params = useParams<{ system: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const system = params.system;
  const launchError = searchParams.get("error");
  const launchReason = searchParams.get("reason");
  const skipAutoLaunch = Boolean(launchError || launchReason === "gateway");
  const [message, setMessage] = useState(
    launchError ??
      (launchReason === "gateway"
        ? "Corporate could not be loaded inside the hub."
        : "Preparing secure sign-in…")
  );

  useEffect(() => {
    if (skipAutoLaunch) {
      const timer = window.setTimeout(() => router.replace("/dashboard"), 5000);
      return () => window.clearTimeout(timer);
    }

    if (!isExternalSystemId(system)) {
      router.replace("/dashboard");
      return;
    }

    const config = getSystemLaunchConfig(system);
    const credentials = getAuthCredentials();

    if (!credentials) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function launchWithSessionForm(
      sessionPath: string,
      label: string,
      target: "_blank" | "_self" = "_blank",
      corporateLoginId?: string,
      sipEmail?: string
    ) {
      setMessage(`Opening ${label}…`);
      submitSessionForm(
        sessionPath,
        credentials!.phone,
        credentials!.password,
        target,
        corporateLoginId,
        sipEmail
      );

      if (target === "_blank") {
        window.setTimeout(() => {
          router.replace("/dashboard");
        }, 800);
      }
    }

    async function launch() {
      try {
        if (system === "iwaste") {
          launchWithSessionForm("/api/systems/iwaste/session", "iWaste");
          return;
        }

        if (system === "corporate") {
          launchWithSessionForm(
            "/api/systems/corporate/session",
            "Corporate",
            "_blank",
            credentials!.corporateLoginId
          );
          return;
        }

        if (system === "sip") {
          const sipEmail = resolveSipEmail(credentials!);
          if (!sipEmail) {
            setMessage("SIP requires an email address. Returning to hub sign-in…");
            window.setTimeout(() => {
              router.replace("/login?reason=sip-email");
            }, 1200);
            return;
          }
          launchWithSessionForm(
            "/api/systems/sip/session",
            "SIP",
            "_blank",
            undefined,
            sipEmail
          );
          return;
        }

        const response = await fetch("/api/systems/access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system,
            phone: credentials!.phone,
            password: credentials!.password,
            sipEmail: resolveSipEmail(credentials!) ?? undefined,
          }),
        });

        const payload = (await response.json()) as AccessResponse;

        if (cancelled) return;

        if (!payload.ok) {
          setMessage(
            payload.message ??
              "You do not have access to this system. Opening sign-in page…"
          );
          window.setTimeout(() => {
            router.replace("/login");
          }, 1200);
          return;
        }

        if (payload.launchMode === "gateway") {
          window.open(payload.redirectUrl, "_blank", "noopener,noreferrer");
          window.setTimeout(() => {
            router.replace("/dashboard");
          }, 600);
          return;
        }

        setMessage(`Signing you in to ${payload.label}…`);
        submitSessionForm(
          `/api/systems/autologin/${system}`,
          credentials!.phone,
          credentials!.password,
          "_blank"
        );

        window.setTimeout(() => {
          router.replace("/dashboard");
        }, 800);
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    void launch();

    return () => {
      cancelled = true;
    };
  }, [launchReason, launchError, router, skipAutoLaunch, system]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="text-center">
        <BrandedLoader />
        <p className="mt-4 text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
