import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PENDING_RESET_TOKEN_COOKIE } from "@/lib/auth";
import { requestPasswordResetOtp } from "@/lib/password-reset-api";

async function readPhoneNo(request: Request): Promise<string> {
  const contentType = request.headers.get("content-type") ?? "";

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await request.formData();
    const value = form.get("phone_no") ?? form.get("phone");
    return typeof value === "string" ? value.trim() : "";
  }

  const body: unknown = await request.json().catch(() => null);
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.phone_no === "string") return record.phone_no.trim();
    if (typeof record.phone === "string") return record.phone.trim();
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const phoneNo = await readPhoneNo(request);
    const cookieStore = await cookies();
    const resetToken = cookieStore.get(PENDING_RESET_TOKEN_COOKIE)?.value;
    const result = await requestPasswordResetOtp(phoneNo, resetToken);

    if (!result.ok) {
      return NextResponse.json(
        {
          message: result.message,
          ...(result.code ? { code: result.code } : {}),
        },
        { status: result.status || 400 }
      );
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch {
    return NextResponse.json(
      { message: "Unable to send verification code." },
      { status: 500 }
    );
  }
}
