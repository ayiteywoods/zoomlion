export function HeroIllustration() {
  return (
    <div
      className="animate-slide-in-right hidden w-[220px] shrink-0 sm:block lg:w-[280px]"
      style={{ animationDelay: "200ms" }}
      aria-hidden
    >
      <svg
        viewBox="0 0 420 320"
        fill="none"
        className="animate-float h-auto max-h-[140px] w-full lg:max-h-[170px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          className="animate-spin-slow origin-[280px_140px]"
          style={{ transformBox: "fill-box", transformOrigin: "center" }}
        >
          <circle
            cx="280"
            cy="140"
            r="110"
            fill="#eff6ff"
            stroke="#bfdbfe"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
          <ellipse cx="280" cy="140" rx="90" ry="30" stroke="#dbeafe" strokeWidth="1" fill="none" />
          <ellipse cx="280" cy="140" rx="30" ry="90" stroke="#dbeafe" strokeWidth="1" fill="none" />
        </g>

        <g className="animate-float-delayed">
          <rect x="60" y="130" width="36" height="90" rx="2" fill="#1d4ed8" />
          <rect x="68" y="145" width="8" height="8" rx="1" fill="#60a5fa" opacity="0.6" className="animate-shimmer" />
          <rect x="68" y="160" width="8" height="8" rx="1" fill="#60a5fa" opacity="0.6" />
          <rect x="68" y="175" width="8" height="8" rx="1" fill="#60a5fa" opacity="0.6" />
          <rect x="100" y="110" width="44" height="110" rx="2" fill="#172554" />
          <rect x="110" y="125" width="10" height="10" rx="1" fill="#60a5fa" opacity="0.6" />
          <rect x="110" y="145" width="10" height="10" rx="1" fill="#60a5fa" opacity="0.6" />
          <rect x="110" y="165" width="10" height="10" rx="1" fill="#60a5fa" opacity="0.6" />
          <rect x="148" y="145" width="32" height="75" rx="2" fill="#2563eb" />
        </g>

        <g className="animate-bounce-soft">
          <rect x="155" y="195" width="70" height="28" rx="4" fill="#2d8a4e" />
          <rect x="195" y="178" width="38" height="32" rx="3" fill="#3da862" />
          <circle cx="172" cy="225" r="10" fill="#172554" />
          <circle cx="172" cy="225" r="5" fill="#6b7280" />
          <circle cx="218" cy="225" r="10" fill="#172554" />
          <circle cx="218" cy="225" r="5" fill="#6b7280" />
        </g>

        <rect x="248" y="200" width="28" height="34" rx="3" fill="#2d8a4e" className="animate-float" />
        <path d="M254 200v-6h16v6" stroke="#2d8a4e" strokeWidth="2" fill="none" />

        <g className="animate-drift" style={{ transformOrigin: "320px 220px" }}>
          <line x1="320" y1="200" x2="320" y2="240" stroke="#94a3b8" strokeWidth="2" />
          <path
            d="M320 210l18-8M320 210l-4 18M320 210l-14-10"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
        <g className="animate-drift-reverse" style={{ transformOrigin: "355px 205px" }}>
          <line x1="355" y1="185" x2="355" y2="225" stroke="#94a3b8" strokeWidth="2" />
          <path
            d="M355 195l16-7M355 195l-3 16M355 195l-13-9"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>

        <ellipse cx="95" cy="218" rx="14" ry="18" fill="#2d8a4e" className="animate-float-delayed" />
        <rect x="92" y="228" width="6" height="14" fill="#8B6914" />
        <ellipse cx="340" cy="228" rx="12" ry="16" fill="#3da862" className="animate-float" />

        <ellipse
          cx="130"
          cy="95"
          rx="8"
          ry="5"
          fill="#4ade80"
          transform="rotate(-30 130 95)"
          className="animate-drift"
        />
        <ellipse
          cx="200"
          cy="80"
          rx="7"
          ry="4"
          fill="#86efac"
          transform="rotate(20 200 80)"
          className="animate-drift-reverse"
        />
        <ellipse
          cx="370"
          cy="120"
          rx="8"
          ry="5"
          fill="#4ade80"
          transform="rotate(15 370 120)"
          className="animate-drift"
        />
      </svg>
    </div>
  );
}
