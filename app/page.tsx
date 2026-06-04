import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE,
  AUTH_LAST_ACTIVITY_COOKIE,
  HUB_SESSION_COOKIE,
  isHubSessionActive,
} from "@/lib/auth";

export default async function RootPage() {
  const cookieStore = await cookies();
  const isAuthenticated = isHubSessionActive(
    cookieStore.get(AUTH_COOKIE)?.value,
    cookieStore.get(AUTH_LAST_ACTIVITY_COOKIE)?.value,
    cookieStore.get(HUB_SESSION_COOKIE)?.value
  );
  redirect(isAuthenticated ? "/dashboard" : "/login");
}
