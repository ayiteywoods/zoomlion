/** Cookie names only — safe to import from Edge middleware (no Node crypto). */

export const IWASTE_SESSION_COOKIE = "zl-sys-iwaste";
export const CORPORATE_SESSION_COOKIE = "zl-sys-corporate";
export const SIP_SESSION_COOKIE = "zl-sys-sip";
/** Set while the user is viewing Corporate via the gateway (collision-path safety net). */
export const CORPORATE_BROWSING_COOKIE = "zl-corporate-active";
/** Set while the user is viewing SIP via the gateway (collision-path safety net). */
export const SIP_BROWSING_COOKIE = "zl-sip-active";
