import Image from "next/image";

type BrandedLoaderProps = {
  fullscreen?: boolean;
  label?: string;
};

export default function BrandedLoader({
  fullscreen = false,
  label = "Signing in…",
}: BrandedLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 bg-brand-950/90 backdrop-blur-sm ${
        fullscreen
          ? "fixed inset-0 z-[200]"
          : "absolute inset-0 z-20 rounded-2xl"
      }`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full border-2 border-brand-300/40" />
        <span className="absolute inline-flex h-20 w-20 rounded-full border-2 border-brand-500/60" />
        <Image
          src="/zl.png"
          alt=""
          width={64}
          height={64}
          className="relative z-10 h-14 w-14 animate-pulse rounded-lg object-contain [animation-duration:2.6s]"
        />
      </div>
      <p className="text-sm font-medium text-on-brand-muted">{label}</p>
    </div>
  );
}
