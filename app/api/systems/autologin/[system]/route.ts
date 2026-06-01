import { NextResponse } from "next/server";
import {
  buildAutoSubmitHtml,
  verifySystemAccess,
} from "@/lib/system-auth";
import {
  getSystemLaunchConfig,
  isExternalSystemId,
  type ExternalSystemId,
} from "@/lib/system-launch";

type RouteContext = {
  params: Promise<{ system: string }>;
};

async function readCredentials(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as { phone?: string; password?: string };
    return {
      phone: body.phone?.trim() ?? "",
      password: body.password ?? "",
    };
  }

  const form = await request.formData();
  return {
    phone: String(form.get("phone") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  };
}

export async function POST(request: Request, context: RouteContext) {
  const { system: systemParam } = await context.params;

  if (!isExternalSystemId(systemParam)) {
    return NextResponse.json({ message: "Unknown system." }, { status: 404 });
  }

  const system = systemParam as ExternalSystemId;
  const config = getSystemLaunchConfig(system);
  const { phone, password } = await readCredentials(request);

  if (!phone || !password) {
    const fallback =
      system === "sip"
        ? new URL("/login?reason=sip", request.url)
        : config.loginUrl;
    return NextResponse.redirect(fallback);
  }

  const result = await verifySystemAccess(system, phone, password);

  if (!result.ok || result.launchMode !== "form" || !result.form) {
    const fallback =
      system === "sip"
        ? new URL("/login?reason=sip", request.url)
        : config.loginUrl;
    return NextResponse.redirect(fallback);
  }

  const html = buildAutoSubmitHtml(
    config.label,
    result.form,
    result.redirectUrl
  );

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { system: systemParam } = await context.params;

  if (!isExternalSystemId(systemParam)) {
    return NextResponse.json({ message: "Unknown system." }, { status: 404 });
  }

  if (systemParam === "sip") {
    return NextResponse.redirect(new URL("/login?reason=sip", _request.url));
  }

  return NextResponse.redirect(getSystemLaunchConfig(systemParam).loginUrl);
}
