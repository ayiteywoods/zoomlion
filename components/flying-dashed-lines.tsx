const paths = [
  {
    d: "M -120 60 Q 280 20 620 90 T 1100 50",
    className: "animate-dash-flow",
    delay: "0s",
    duration: "14s",
    opacity: 0.35,
  },
  {
    d: "M -80 180 Q 320 140 700 200 T 1150 160",
    className: "animate-dash-flow-reverse",
    delay: "2s",
    duration: "18s",
    opacity: 0.28,
  },
  {
    d: "M 900 -40 Q 600 120 300 220 T -100 280",
    className: "animate-dash-flow",
    delay: "4s",
    duration: "16s",
    opacity: 0.25,
  },
  {
    d: "M -60 320 Q 400 280 800 340 T 1200 300",
    className: "animate-dash-flow-reverse",
    delay: "1s",
    duration: "20s",
    opacity: 0.3,
  },
];

const flyers = [
  { top: "12%", rotate: -8, delay: "0s", duration: "11s" },
  { top: "28%", rotate: 12, delay: "2.5s", duration: "13s" },
  { top: "48%", rotate: -5, delay: "1.2s", duration: "15s" },
  { top: "68%", rotate: 18, delay: "4s", duration: "12s" },
  { top: "82%", rotate: -14, delay: "3s", duration: "14s" },
];

export function FlyingDashedLines() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 360"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, index) => (
          <path
            key={path.d}
            d={path.d}
            stroke="#6366f1"
            strokeWidth="1.5"
            strokeDasharray="10 8"
            strokeLinecap="round"
            opacity={path.opacity}
            className={path.className}
            style={{
              animationDelay: path.delay,
              animationDuration: path.duration,
            }}
          />
        ))}
        {/* Conveyor-style horizontal routes */}
        <path
          d="M 0 120 H 1000"
          stroke="#818cf8"
          strokeWidth="1"
          strokeDasharray="6 10"
          opacity="0.2"
          className="animate-dash-flow"
          style={{ animationDuration: "8s" }}
        />
        <path
          d="M 0 250 H 1000"
          stroke="#a5b4fc"
          strokeWidth="1"
          strokeDasharray="8 12"
          opacity="0.18"
          className="animate-dash-flow-reverse"
          style={{ animationDuration: "10s", animationDelay: "1.5s" }}
        />
      </svg>

      {flyers.map((flyer, index) => (
        <div
          key={index}
          className="animate-fly-across absolute left-0"
          style={{
            top: flyer.top,
            animationDelay: flyer.delay,
            animationDuration: flyer.duration,
          }}
        >
          <div
            className="h-0 w-28 border-t-2 border-dashed border-blue-200/50 sm:w-48"
            style={{ transform: `rotate(${flyer.rotate}deg)` }}
          />
        </div>
      ))}
    </div>
  );
}
