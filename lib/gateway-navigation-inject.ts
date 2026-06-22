/** Keep in-app links and AJAX under the gateway (avoids hub route collisions). */
export function injectGatewayNavigation(
  html: string,
  gatewayPathPrefix: string,
  pathAliases: Record<string, string> = {},
  upstreamOrigin = ""
): string {
  const script = `<script>
(function () {
  var GATEWAY = ${JSON.stringify(gatewayPathPrefix.replace(/\/+$/, ""))};
  var UPSTREAM = ${JSON.stringify(upstreamOrigin.replace(/\/+$/, ""))};
  var ALIASES = ${JSON.stringify(pathAliases)};
  var HUB_PREFIXES = ["/_next/", "/api/auth/", "/api/systems/"];

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

  function rewritePathname(pathname) {
    if (!shouldRewrite(pathname)) return null;
    var nextPath = toGatewayPath(pathname);
    if (nextPath === pathname) return null;
    return nextPath;
  }

  function rewriteUrl(url) {
    if (!url) return null;

    if (UPSTREAM && url.origin === UPSTREAM) {
      var upstreamPath = rewritePathname(url.pathname);
      if (upstreamPath) return upstreamPath + url.search + url.hash;
      return null;
    }

    if (url.origin !== location.origin) return null;
    var nextPath = rewritePathname(url.pathname);
    if (!nextPath) return null;
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

  function patchFetchInput(input) {
    if (typeof input === "string") {
      var next = rewriteRawHref(input);
      return next || input;
    }
    if (input && typeof input === "object" && typeof input.url === "string") {
      var rewritten = rewriteRawHref(input.url);
      if (rewritten && rewritten !== input.url) {
        return new Request(rewritten, input);
      }
    }
    return input;
  }

  if (typeof window.fetch === "function") {
    var nativeFetch = window.fetch;
    window.fetch = function (input, init) {
      return nativeFetch.call(this, patchFetchInput(input), init);
    };
  }

  if (typeof XMLHttpRequest !== "undefined") {
    var nativeOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof url === "string") {
        var next = rewriteRawHref(url);
        if (next) args[1] = next;
      }
      return nativeOpen.apply(this, args);
    };
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

  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${script}`);
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", `${script}</body>`);
  }
  return `${html}${script}`;
}
