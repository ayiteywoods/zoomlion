import {
  extractAuthToken,
  extractAuthUser,
  isEmailIdentifier,
  loginCorporateWithCredentials,
  loginIwasteWithCredentials,
} from "@/lib/auth-api";
import { establishCorporateSession } from "@/lib/corporate-web-auth";
import { loginIwasteWebSession } from "@/lib/iwaste-web-auth";
import { loginSipWebSession } from "@/lib/sip-web-auth";
import {
  getSystemLaunchConfig,
  type ExternalSystemId,
} from "@/lib/system-launch";

export type SystemAccessResult =
  | {
      ok: true;
      redirectUrl: string;
      launchMode: "gateway" | "form";
      form?: {
        action: string;
        method: "POST";
        fields: Record<string, string>;
      };
    }
  | {
      ok: false;
      loginUrl: string;
      message?: string;
    };

async function verifyIwasteAccess(
  phone: string,
  password: string
): Promise<SystemAccessResult> {
  const config = getSystemLaunchConfig("iwaste");
  const apiResult = await loginIwasteWithCredentials(phone, password);

  if (!apiResult.ok) {
    return {
      ok: false,
      loginUrl: config.loginUrl,
      message: apiResult.message,
    };
  }

  const webResult = await loginIwasteWebSession(phone, password);

  if (!webResult.ok) {
    return {
      ok: false,
      loginUrl: config.loginUrl,
      message: webResult.message ?? "Unable to sign in to iWaste.",
    };
  }

  return {
    ok: true,
    redirectUrl: "/systems/gateway/iwaste/home",
    launchMode: "gateway",
  };
}

async function verifyCorporateAccess(
  phone: string,
  password: string
): Promise<SystemAccessResult> {
  const config = getSystemLaunchConfig("corporate");
  const apiResult = await loginCorporateWithCredentials(phone, password);

  if (!apiResult.ok) {
    return {
      ok: false,
      loginUrl: config.loginUrl,
      message: apiResult.message,
    };
  }

  const user = extractAuthUser(apiResult.data);
  const extraIds: string[] = [];
  if (user?.email?.trim()) extraIds.push(user.email.trim());
  if (user?.phone_no?.trim()) extraIds.push(user.phone_no.trim());
  if (user?.username?.trim()) extraIds.push(user.username.trim());

  const webResult = await establishCorporateSession(phone, password, extraIds);

  if (!webResult.ok) {
    return {
      ok: false,
      loginUrl: config.loginUrl,
      message: webResult.message ?? "Unable to sign in to Corporate.",
    };
  }

  return {
    ok: true,
    redirectUrl: `/systems/gateway/corporate${webResult.entryPath}`,
    launchMode: "gateway",
  };
}

export type CorporateGatewaySessionResult =
  | {
      ok: true;
      cookieHeader: string;
      bearerToken?: string;
      entryPath: string;
      apiOnly?: boolean;
      loginPhone: string;
      loginPassword: string;
    }
  | { ok: false; message?: string; loginPhone?: string };

export async function createCorporateGatewaySession(
  username: string,
  password: string,
  preferredLoginId?: string
): Promise<CorporateGatewaySessionResult> {
  const hubPhone = username.trim();
  const extraLoginIds: string[] = [];

  if (hubPhone) extraLoginIds.push(hubPhone);
  if (preferredLoginId?.trim() && preferredLoginId.trim() !== hubPhone) {
    extraLoginIds.push(preferredLoginId.trim());
  }

  const apiProbe = await loginCorporateWithCredentials(hubPhone, password);

  if (apiProbe.ok) {
    const user = extractAuthUser(apiProbe.data);
    const apiPhone = user?.phone_no?.trim();
    if (apiPhone && !extraLoginIds.includes(apiPhone)) {
      extraLoginIds.unshift(apiPhone);
    }
    if (user?.username?.trim() && !extraLoginIds.includes(user.username.trim())) {
      extraLoginIds.push(user.username.trim());
    }
  }

  if (!apiProbe.ok) {
    return { ok: false, message: apiProbe.message };
  }

  const bearerToken = extractAuthToken(apiProbe.data) ?? undefined;
  const session = await establishCorporateSession(
    hubPhone,
    password,
    extraLoginIds
  );

  if (session.ok && session.cookieHeader.trim()) {
    return {
      ok: true,
      cookieHeader: session.cookieHeader,
      bearerToken: session.bearerToken ?? bearerToken,
      entryPath: session.entryPath,
      apiOnly: false,
      loginPhone: hubPhone,
      loginPassword: password,
    };
  }

  return {
    ok: true,
    cookieHeader: "",
    bearerToken,
    entryPath: "",
    apiOnly: false,
    loginPhone: hubPhone,
    loginPassword: password,
  };
}

function resolveSipLoginIdForAccess(
  username: string,
  sipLoginOverride?: string
): string | null {
  if (username.trim()) return username.trim();
  if (sipLoginOverride?.trim()) return sipLoginOverride.trim();
  return null;
}

async function verifySipAccess(
  username: string,
  password: string,
  sipLoginOverride?: string
): Promise<SystemAccessResult> {
  const config = getSystemLaunchConfig("sip");
  const loginId = resolveSipLoginIdForAccess(username, sipLoginOverride);

  if (!loginId) {
    return {
      ok: false,
      loginUrl: config.loginUrl,
      message:
        "SIP requires an email address or phone number. Sign in to the hub, then try again.",
    };
  }

  const webResult = await loginSipWebSession(loginId, password);

  if (!webResult.ok) {
    return {
      ok: false,
      loginUrl: config.loginUrl,
      message:
        webResult.message ??
        "Unable to sign in to SIP. Use your SIP email or phone and password.",
    };
  }

  return {
    ok: true,
    redirectUrl: "/systems/gateway/sip",
    launchMode: "gateway",
  };
}

export async function createSipGatewaySession(loginId: string, password: string) {
  return loginSipWebSession(loginId, password);
}

export async function verifySystemAccess(
  system: ExternalSystemId,
  phone: string,
  password: string,
  sipEmail?: string
): Promise<SystemAccessResult> {
  switch (system) {
    case "iwaste":
      return verifyIwasteAccess(phone, password);
    case "corporate":
      return verifyCorporateAccess(phone, password);
    case "sip":
      return verifySipAccess(phone, password, sipEmail);
    default:
      return {
        ok: false,
        loginUrl: getSystemLaunchConfig(system).loginUrl,
        message: "Unknown system.",
      };
  }
}

export async function createIwasteGatewaySession(
  phone: string,
  password: string
) {
  return loginIwasteWebSession(phone, password);
}

export function buildAutoSubmitHtml(
  label: string,
  form: {
    action: string;
    method: "POST";
    fields: Record<string, string>;
  },
  redirectUrl: string
): string {
  const fields = Object.entries(form.fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Signing in to ${escapeHtml(label)}…</title>
    <style>
      body {
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        background: #f8fafc;
        color: #0f172a;
      }
      .card { text-align: center; padding: 2rem; }
    </style>
  </head>
  <body>
    <div class="card">
      <p>Signing you in to ${escapeHtml(label)}…</p>
    </div>
    <form id="sso-form" method="${form.method}" action="${escapeHtml(form.action)}" target="_self">
      ${fields}
    </form>
    <script>
      document.getElementById("sso-form").submit();
    </script>
    <noscript>
      <p><a href="${escapeHtml(redirectUrl)}">Continue to ${escapeHtml(label)}</a></p>
    </noscript>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
