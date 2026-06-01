export function buildCorporateApiShellHtml(options: {
  userName?: string;
  userPhone?: string;
}): string {
  const name = options.userName ?? "there";
  const phoneHint = options.userPhone
    ? `<p class="hint">Sign in with phone number <strong>${escapeHtml(options.userPhone)}</strong> and the same password you use for the hub.</p>`
    : `<p class="hint">Sign in with the same phone number and password you use for the hub.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Corporate</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 100%);
        color: #f8fafc;
        display: grid;
        place-items: center;
        padding: 1.5rem;
      }
      .card {
        max-width: 28rem;
        width: 100%;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        backdrop-filter: blur(8px);
      }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 600; }
      p { margin: 0 0 1rem; font-size: 0.9rem; line-height: 1.5; color: #cbd5e1; }
      .hint { font-size: 0.85rem; margin-bottom: 1.5rem; }
      a.btn {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background: #2563eb;
        color: #fff;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: 500;
        font-size: 0.95rem;
      }
      a.btn:hover { background: #1d4ed8; }
      .secondary {
        display: block;
        margin-top: 1rem;
        color: #94a3b8;
        font-size: 0.8rem;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hi ${escapeHtml(name)}</h1>
      <p>Your Corporate API account is active. The web dashboard must be opened on the Corporate site (the hub cannot embed it yet).</p>
      ${phoneHint}
      <a class="btn" href="https://corporate.adudor.com" target="_blank" rel="noopener noreferrer">Open Corporate dashboard</a>
      <a class="secondary" href="/dashboard">Back to hub</a>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}
