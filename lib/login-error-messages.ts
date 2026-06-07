export type HubSystemId = "iwaste" | "corporate" | "sip";

export type LoginFailureReason =
  | "success"
  | "account_not_found"
  | "password_error"
  | "authentication_error"
  | "network_error"
  | "skipped";

export type LoginErrorCode =
  | "ACCOUNT_NOT_FOUND"
  | "PASSWORD_ERROR"
  | "AUTHENTICATION_ERROR"
  | "PARTIAL_ENROLLMENT"
  | "NETWORK_ERROR";

export type SystemLoginAttempt = {
  system: HubSystemId;
  ok: boolean;
  status: number;
  message: string;
  reason: LoginFailureReason;
};

const SYSTEM_LABELS: Record<HubSystemId, string> = {
  iwaste: "iWaste",
  corporate: "Corporate",
  sip: "SIP",
};

export const HUB_LOGIN_MESSAGES = {
  accountNotFound:
    "User Account Does Not Exist. Please contact your System Administrator.",
  passwordError:
    "Password Error. The password you entered is incorrect. Please try again.",
  authenticationError:
    "Authentication Error. Unable to sign in at this time. Please try again or contact your System Administrator.",
  networkError:
    "Network error. Please check your connection and try again.",
} as const;

function isRouteNotFoundMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("route") && lower.includes("could not be found");
}

export function classifyLoginFailure(
  status: number,
  message: string
): LoginFailureReason {
  if (status === 0) return "network_error";

  const lower = message.toLowerCase();

  if (isRouteNotFoundMessage(lower)) {
    return "authentication_error";
  }

  if (
    status === 404 ||
    lower.includes("does not exist") ||
    lower.includes("do not exist") ||
    lower.includes("not exist") ||
    lower.includes("no account") ||
    lower.includes("unknown user") ||
    lower.includes("user not found") ||
    lower.includes("account not found") ||
    lower.includes("not registered")
  ) {
    return "account_not_found";
  }

  if (
    lower.includes("password") ||
    lower.includes("validation error") ||
    lower.includes("recheck your form") ||
    lower.includes("credentials could not be verified") ||
    lower.includes("invalid credentials") ||
    lower.includes("wrong password") ||
    lower.includes("incorrect password") ||
    lower.includes("given data was invalid") ||
    lower.includes("unauthorized") ||
    status === 401 ||
    status === 422
  ) {
    return "password_error";
  }

  if (status === 403) return "authentication_error";

  return "authentication_error";
}

function formatSystemList(systems: HubSystemId[]): string {
  const labels = systems.map((system) => SYSTEM_LABELS[system]);
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

function formatPartialEnrollment(
  existsIn: HubSystemId[],
  missingFrom: HubSystemId[]
): string {
  return `Your account exists in ${formatSystemList(existsIn)} but was not found in ${formatSystemList(missingFrom)}. Please contact your System Administrator to enable access to those systems.`;
}

export function buildHubLoginFailure(
  attempts: SystemLoginAttempt[]
): { message: string; status: number; code: LoginErrorCode } {
  const failures = attempts.filter(
    (attempt) => !attempt.ok && attempt.reason !== "skipped"
  );

  if (failures.length === 0) {
    return {
      message: HUB_LOGIN_MESSAGES.authenticationError,
      status: 401,
      code: "AUTHENTICATION_ERROR",
    };
  }

  if (failures.every((attempt) => attempt.reason === "network_error")) {
    return {
      message: HUB_LOGIN_MESSAGES.networkError,
      status: 503,
      code: "NETWORK_ERROR",
    };
  }

  const existsIn = failures
    .filter((attempt) => attempt.reason === "password_error")
    .map((attempt) => attempt.system);
  const notFoundIn = failures
    .filter((attempt) => attempt.reason === "account_not_found")
    .map((attempt) => attempt.system);

  if (existsIn.length > 0 && notFoundIn.length > 0) {
    return {
      message: formatPartialEnrollment(existsIn, notFoundIn),
      status: 401,
      code: "PARTIAL_ENROLLMENT",
    };
  }

  if (failures.every((attempt) => attempt.reason === "account_not_found")) {
    return {
      message: HUB_LOGIN_MESSAGES.accountNotFound,
      status: 401,
      code: "ACCOUNT_NOT_FOUND",
    };
  }

  if (failures.some((attempt) => attempt.reason === "password_error")) {
    const rejectedBy = failures
      .filter((attempt) => attempt.reason === "password_error")
      .map((attempt) => SYSTEM_LABELS[attempt.system]);

    let message = HUB_LOGIN_MESSAGES.passwordError;
    if (rejectedBy.length > 0 && rejectedBy.length < failures.length) {
      message += ` Sign-in was rejected by ${formatSystemList(
        failures
          .filter((attempt) => attempt.reason === "password_error")
          .map((attempt) => attempt.system)
      )}.`;
    }

    return {
      message,
      status: 401,
      code: "PASSWORD_ERROR",
    };
  }

  return {
    message: HUB_LOGIN_MESSAGES.authenticationError,
    status: 401,
    code: "AUTHENTICATION_ERROR",
  };
}

export function toSystemLoginAttempt(
  system: HubSystemId,
  result: { ok: true } | { ok: false; status: number; message: string }
): SystemLoginAttempt {
  if (result.ok) {
    return {
      system,
      ok: true,
      status: 200,
      message: "",
      reason: "success",
    };
  }

  return {
    system,
    ok: false,
    status: result.status,
    message: result.message,
    reason: classifyLoginFailure(result.status, result.message),
  };
}

export function formatAttemptSummary(attempts: SystemLoginAttempt[]) {
  return attempts
    .filter((attempt) => attempt.reason !== "skipped")
    .map((attempt) => ({
      system: SYSTEM_LABELS[attempt.system],
      reason: attempt.reason,
      message: attempt.message || undefined,
    }));
}
