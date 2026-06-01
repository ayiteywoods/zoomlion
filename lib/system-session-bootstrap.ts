function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Shown in a new tab when system launch fails (avoids hub /login → /dashboard redirect). */
export function buildSystemSessionErrorHtml(
  message: string,
  systemLabel: string
): string {
  const safeMessage = escapeHtml(message);
  const safeLabel = escapeHtml(systemLabel);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Could not open ${safeLabel}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        font-family: system-ui, sans-serif;
        background: #f8fafc;
        color: #0f172a;
      }
      .card {
        max-width: 28rem;
        border: 1px solid #fecaca;
        border-radius: 0.75rem;
        background: #fff1f2;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin: 0 0 0.5rem;
        font-size: 1.125rem;
        font-weight: 600;
        color: #9f1239;
      }
      p { margin: 0; line-height: 1.5; color: #881337; font-size: 0.9375rem; }
      .hint {
        margin-top: 0.75rem;
        font-size: 0.8125rem;
        color: #64748b;
      }
    </style>
  </head>
  <body>
    <div class="card" role="alert">
      <h1>Could not open ${safeLabel}</h1>
      <p>${safeMessage}</p>
      <p class="hint">You can close this tab and return to the hub dashboard.</p>
    </div>
  </body>
</html>`;
}

/** HTML response so navigation works after a form POST (e.g. into a new tab). */
export function buildSystemSessionBootstrapHtml(
  targetUrl: string,
  label: string
): string {
  const safeUrl = targetUrl.replace(/"/g, "&quot;");
  const title = `Opening ${label}…`;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${safeUrl}" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, sans-serif;
        background: #0f172a;
        color: #e2e8f0;
      }
    </style>
  </head>
  <body>
    <p>${title}</p>
    <script>location.replace(${JSON.stringify(targetUrl)});</script>
  </body>
</html>`;
}
