import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/zl.png"
      alt="Zoomlion — Waste Management Experts"
      width={200}
      height={72}
      className="h-11 w-auto object-contain object-left lg:h-14"
      priority
    />
  );
}
