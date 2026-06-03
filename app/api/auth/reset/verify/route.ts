import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PENDING_RESET_TOKEN_COOKIE } from "@/lib/auth";
import { verifyPasswordResetOtp } from "@/lib/password-reset-api";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const record =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const phoneNo = typeof record.phone_no === "string" ? record.phone_no : "";
    const otp =
      typeof record.otp === "string"
        ? record.otp
        : typeof record.code === "string"
          ? record.code
          : "";

    const cookieStore = await cookies();
    const resetToken = cookieStore.get(PENDING_RESET_TOKEN_COOKIE)?.value;
    const result = await verifyPasswordResetOtp(phoneNo, otp, resetToken);

    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch {
    return NextResponse.json(
      { message: "Unable to verify code." },
      { status: 500 }
    );
  }
}
