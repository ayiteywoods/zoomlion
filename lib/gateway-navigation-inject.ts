/** Keep in-app links under the gateway (avoids hub route collisions e.g. /dashboard, /profile). */
export function injectGatewayNavigation(
  html: string,
  gatewayPathPrefix: string,
  pathAliases: Record<string, string> = {}
): string {
  const script = `<script>
(function () {
  var GATEWAY = ${JSON.stringify(gatewayPathPrefix.replace(/\/+$/, ""))};
  var ALIASES = ${JSON.stringify(pathAliases)};
  var HUB_PREFIXES = ["/_next/", "/api/auth/"];

  function shouldRewrite(pathname) {
    if (!pathname || pathname.charAt(0) !== "/") return false;
    if (pathname.indexOf(GATEWAY) === 0) return false;
    for (var i = 0; i < HUB_PREFIXES.length; i++) {
      if (pathname.indexOf(HUB_PREFIXES[i]) === 0) return false;
    }
    return true;
  }

  function toGatewayPath(pathname) {
    if (Object.prototype.hasOwnProperty.call(ALIASES, pathname)) {
      var alias = ALIASES[pathname];
      return alias ? GATEWAY + alias : GATEWAY;
    }
    if (pathname === "/login" || pathname === "/login/") return GATEWAY;
    if (pathname === "/") return GATEWAY;
    return GATEWAY + pathname;
  }

  function rewriteUrl(url) {
    if (!url || url.origin !== location.origin) return null;
    if (!shouldRewrite(url.pathname)) return null;
    var nextPath = toGatewayPath(url.pathname);
    if (nextPath === url.pathname) return null;
    return nextPath + url.search + url.hash;
  }

  function rewriteRawHref(raw) {
    if (
      !raw ||
      raw.charAt(0) === "#" ||
      raw.indexOf("mailto:") === 0 ||
      raw.indexOf("tel:") === 0 ||
      raw.indexOf("javascript:") === 0
    ) {
      return null;
    }
    try {
      return rewriteUrl(new URL(raw, location.href));
    } catch (e) {
      return null;
    }
  }

  function patchElement(el) {
    if (el.tagName === "A" && el.hasAttribute("href")) {
      var next = rewriteRawHref(el.getAttribute("href"));
      if (next) el.setAttribute("href", next);
    }
    if (el.tagName === "FORM" && el.hasAttribute("action")) {
      var action = rewriteRawHref(el.getAttribute("action"));
      if (action) el.setAttribute("action", action);
    }
  }

  function patchTree(root) {
    if (!root || root.nodeType !== 1) return;
    if (root.matches && root.matches("a[href], form[action]")) patchElement(root);
    var nodes = root.querySelectorAll("a[href], form[action]");
    for (var i = 0; i < nodes.length; i++) patchElement(nodes[i]);
  }

  function navigateTo(url) {
    var next = rewriteUrl(url);
    if (next) {
      location.assign(next);
      return true;
    }
    return false;
  }

  function boot() {
    patchTree(document.documentElement);
    if (typeof MutationObserver !== "undefined") {
      new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
          var added = mutations[i].addedNodes;
          for (var j = 0; j < added.length; j++) patchTree(added[j]);
        }
      }).observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  document.addEventListener(
    "submit",
    function (event) {
      var form = event.target;
      if (!form || !form.action) return;
      try {
        var url = new URL(form.action, location.href);
        var next = rewriteUrl(url);
        if (next) form.action = next;
      } catch (e) {}
    },
    true
  );

  document.addEventListener(
    "click",
    function (event) {
      var anchor = event.target.closest && event.target.closest("a[href]");
      if (!anchor) return;
      var raw = anchor.getAttribute("href");
      if (
        !raw ||
        raw.charAt(0) === "#" ||
        raw.indexOf("mailto:") === 0 ||
        raw.indexOf("tel:") === 0 ||
        raw.indexOf("javascript:") === 0
      ) {
        return;
      }
      try {
        var url = new URL(raw, location.href);
        if (navigateTo(url)) event.preventDefault();
      } catch (e) {}
    },
    true
  );

  var pushState = history.pushState;
  history.pushState = function (state, title, url) {
    if (typeof url === "string") {
      try {
        var parsed = new URL(url, location.href);
        var next = rewriteUrl(parsed);
        if (next) url = next;
      } catch (e) {}
    }
    return pushState.call(this, state, title, url);
  };

  var replaceState = history.replaceState;
  history.replaceState = function (state, title, url) {
    if (typeof url === "string") {
      try {
        var parsed = new URL(url, location.href);
        var next = rewriteUrl(parsed);
        if (next) url = next;
      } catch (e) {}
    }
    return replaceState.call(this, state, title, url);
  };
})();
</script>`;

  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}</body>`);
  }
  return `${html}${script}`;
}
