import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  HUB_PASSWORD_SETUP_COOKIE,
  PENDING_PASSWORD_RESET_COOKIE,
  PENDING_RESET_FLOW_COOKIE,
  PENDING_RESET_TOKEN_COOKIE,
} from "@/lib/auth";
import { resetPasswordAllSystems } from "@/lib/password-reset-api";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const phoneNo = typeof record.phone_no === "string" ? record.phone_no : "";
    const password = typeof record.password === "string" ? record.password : "";

    if (!phoneNo.trim()) {
      return NextResponse.json(
        { message: "Phone number is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const result = await resetPasswordAllSystems(
      phoneNo,
      password,
      cookieStore.get(PENDING_RESET_TOKEN_COOKIE)?.value
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          message: result.message,
          results: result.results,
        },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: result.message,
      results: result.results,
    });
    response.cookies.set(PENDING_PASSWORD_RESET_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set(PENDING_RESET_TOKEN_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set(PENDING_RESET_FLOW_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set(HUB_PASSWORD_SETUP_COOKIE, phoneNo.trim(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to reset password." },
      { status: 500 }
    );
  }
}
