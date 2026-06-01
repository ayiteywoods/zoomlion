export function AnimatedBackground() {
  return (
    <>
      <div className="animate-blob absolute -left-16 top-8 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />
      <div className="animate-blob-delayed absolute -right-12 bottom-4 h-64 w-64 rounded-full bg-primary-soft blur-3xl" />
      <div className="animate-float absolute left-1/3 top-1/2 h-40 w-40 rounded-full bg-blue-200/30 blur-3xl" />
    </>
  );
}
