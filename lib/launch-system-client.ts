"use client";

import {
  getAuthCredentials,
  resolveSipEmail,
  type StoredAuthCredentials,
} from "@/lib/auth-credentials";
import type { ExternalSystemId } from "@/lib/system-launch";

export type LaunchResult = { ok: true } | { ok: false; message: string };

function submitSessionForm(
  system: ExternalSystemId,
  credentials: StoredAuthCredentials
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = `/api/systems/${system}/session`;
  form.target = "_blank";
  form.style.display = "none";

  const fields: [string, string][] = [
    ["phone", credentials.phone],
    ["password", credentials.password],
  ];

  if (credentials.corporateLoginId) {
    fields.push(["corporate_login_id", credentials.corporateLoginId]);
  }

  const sipEmail = resolveSipEmail(credentials);
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

/**
 * Open a system in a new tab via form POST so session cookies are set in that tab.
 * Must be called synchronously from a click handler.
 */
export function launchExternalSystem(system: ExternalSystemId): LaunchResult {
  const credentials = getAuthCredentials();
  if (!credentials) {
    return { ok: false, message: "Please sign in to the hub first." };
  }

  if (system === "sip" && !resolveSipEmail(credentials)) {
    return {
      ok: false,
      message:
        "SIP requires an email address. Sign in with your SIP email, or use a hub account that has an email on file.",
    };
  }

  submitSessionForm(system, credentials);
  return { ok: true };
}
