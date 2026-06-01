import { NextResponse } from "next/server";
import { fetchUserProfile, getLoginErrorMessage } from "@/lib/auth-api";

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function POST(request: Request) {
  try {
    const token = readBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const result = await fetchUserProfile(token);

    if (!result.ok) {
      return NextResponse.json(
        { message: result.message },
        { status: result.status || 401 }
      );
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json(
      { message: getLoginErrorMessage(null, "Unable to load profile.") },
      { status: 500 }
    );
  }
}
