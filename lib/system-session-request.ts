import { NextResponse } from "next/server";

/**
 * After a browser form POST, follow-up navigation must use GET.
 * NextResponse.redirect() defaults to 307, which keeps POST and breaks
 * upstream apps whose pages only allow GET (e.g. Corporate `/`).
 */
export function redirectAfterFormPost(url: string | URL) {
  return NextResponse.redirect(url, 303);
}

export type SystemLaunchCredentials = {
  phone: string;
  password: string;
  corporateLoginId?: string;
  sipEmail?: string;
  /** Browser form POST — respond with redirect + Set-Cookie instead of JSON */
  redirectOnSuccess: boolean;
};

export async function readSystemLaunchCredentials(
  request: Request
): Promise<SystemLaunchCredentials> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      phone?: string;
      username?: string;
      password?: string;
    };

    return {
      phone: (body.phone ?? body.username ?? "").trim(),
      password: body.password ?? "",
      redirectOnSuccess: false,
    };
  }

  const form = await request.formData();
  const corporateLoginId = String(form.get("corporate_login_id") ?? "").trim();
  const sipEmail = String(form.get("sip_email") ?? "").trim();
  return {
    phone: String(form.get("phone") ?? form.get("username") ?? "").trim(),
    password: String(form.get("password") ?? ""),
    corporateLoginId: corporateLoginId || undefined,
    sipEmail: sipEmail || undefined,
    redirectOnSuccess: true,
  };
}
