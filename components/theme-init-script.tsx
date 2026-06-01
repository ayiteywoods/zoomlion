"use client";

import { useServerInsertedHTML } from "next/navigation";

const themeInitScript = `(function(){try{var m=localStorage.getItem("zl-theme-mode")||"light";var d=m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);var b=localStorage.getItem("zl-brand");if(b)document.documentElement.dataset.brand=b;}catch(e){}})();`;

export function ThemeInitScript() {
  useServerInsertedHTML(() => (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  ));

  return null;
}
