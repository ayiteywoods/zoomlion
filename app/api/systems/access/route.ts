import { NextResponse } from "next/server";
import { verifySystemAccess } from "@/lib/system-auth";
import {
  getSystemLaunchConfig,
  isExternalSystemId,
} from "@/lib/system-launch";

type AccessRequestBody = {
  system?: string;
  phone?: string;
  password?: string;
  sipEmail?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AccessRequestBody;
    const system = body.system ?? "";
    const phone = body.phone?.trim() ?? "";
    const password = body.password ?? "";

    if (!isExternalSystemId(system)) {
      return NextResponse.json(
        { ok: false, message: "Unknown system." },
        { status: 400 }
      );
    }

    if (!phone || !password) {
      return NextResponse.json(
        {
          ok: false,
          loginUrl: getSystemLaunchConfig(system).loginUrl,
          message: "Saved credentials are missing. Please sign in again.",
        },
        { status: 401 }
      );
    }

    const sipEmail = body.sipEmail?.trim();
    const result = await verifySystemAccess(system, phone, password, sipEmail);

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        loginUrl: result.loginUrl,
        message: result.message ?? "Unable to access this system.",
      });
    }

    return NextResponse.json({
      ok: true,
      redirectUrl: result.redirectUrl,
      launchMode: result.launchMode,
      form: result.form,
      label: getSystemLaunchConfig(system).label,
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to verify system access." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "Method not allowed." }, {
    status: 405,
  });
}
