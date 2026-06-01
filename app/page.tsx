import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE } from "@/lib/auth";

export default async function RootPage() {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(AUTH_COOKIE)?.value === "1";
  redirect(isAuthenticated ? "/dashboard" : "/login");
}
