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
