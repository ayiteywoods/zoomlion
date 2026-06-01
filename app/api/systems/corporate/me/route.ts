import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CORPORATE_ORIGIN } from "@/lib/corporate-web-auth";
import {
  CORPORATE_SESSION_COOKIE,
  getSystemSession,
} from "@/lib/system-session-store";

export async function GET() {
  const cookieStore = await cookies();
  const sealed = cookieStore.get(CORPORATE_SESSION_COOKIE)?.value;

  if (!sealed) {
    return NextResponse.json({ ok: false, message: "No session." }, { status: 401 });
  }

  const session = getSystemSession(sealed);
  if (!session?.bearerToken) {
    return NextResponse.json({ ok: false, message: "No API token." }, { status: 401 });
  }

  try {
    const response = await fetch(`${CORPORATE_ORIGIN}/api/user`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.bearerToken}`,
      },
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        { ok: false, message: "Unable to load Corporate profile." },
        { status: response.status }
      );
    }

    const record = payload as Record<string, unknown>;
    const data =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : record;

    return NextResponse.json({
      ok: true,
      user: {
        name: typeof data.name === "string" ? data.name : undefined,
        email: typeof data.email === "string" ? data.email : undefined,
        phone: typeof data.phone === "string" ? data.phone : undefined,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, message: "Unable to reach Corporate." },
      { status: 502 }
    );
  }
}
