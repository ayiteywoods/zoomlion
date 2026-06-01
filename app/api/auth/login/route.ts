import { NextResponse } from "next/server";
import {
  getLoginErrorMessage,
  loginWithCredentials,
} from "@/lib/auth-api";

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const phoneNo =
      (typeof incoming.get("phone_no") === "string"
        ? incoming.get("phone_no")
        : null) ??
      (typeof incoming.get("username") === "string"
        ? incoming.get("username")
        : null) ??
      (typeof incoming.get("identifier") === "string"
        ? incoming.get("identifier")
        : null);
    const password = incoming.get("password");

    if (typeof phoneNo !== "string" || !phoneNo.trim()) {
      return NextResponse.json(
        { message: "Username or phone number is required." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || !password) {
      return NextResponse.json(
        { message: "Password is required." },
        { status: 400 }
      );
    }

    const result = await loginWithCredentials(phoneNo, password);

    if (!result.ok) {
      const status =
        result.status === 422 ? 401 : result.status || 401;
      return NextResponse.json({ message: result.message }, { status });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { message: getLoginErrorMessage(null) },
      { status: 500 }
    );
  }
}
