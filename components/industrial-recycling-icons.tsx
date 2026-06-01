import {
  ArrowPathIcon,
  BeakerIcon,
  BoltIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  CubeIcon,
  TruckIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

type FloatingIcon = {
  Icon: typeof TruckIcon;
  className: string;
  animation: string;
  delay?: string;
  duration?: string;
  size: string;
};

const floatingIcons: FloatingIcon[] = [
  {
    Icon: TruckIcon,
    className: "left-[4%] top-[18%]",
    animation: "animate-float",
    delay: "0s",
    size: "h-11 w-11 sm:h-14 sm:w-14",
  },
  {
    Icon: ArrowPathIcon,
    className: "right-[6%] top-[22%]",
    animation: "animate-recycle-spin",
    delay: "0.5s",
    size: "h-12 w-12 sm:h-16 sm:w-16",
  },
  {
    Icon: BuildingOffice2Icon,
    className: "left-[10%] bottom-[22%]",
    animation: "animate-drift",
    delay: "1s",
    size: "h-10 w-10 sm:h-12 sm:w-12",
  },
  {
    Icon: CubeIcon,
    className: "right-[8%] bottom-[28%]",
    animation: "animate-float-delayed",
    size: "h-9 w-9 sm:h-11 sm:w-11",
  },
  {
    Icon: Cog6ToothIcon,
    className: "left-[22%] top-[8%]",
    animation: "animate-spin-slow",
    size: "h-10 w-10 sm:h-12 sm:w-12",
  },
  {
    Icon: BeakerIcon,
    className: "right-[20%] top-[12%]",
    animation: "animate-drift-reverse",
    delay: "2s",
    size: "h-9 w-9 sm:h-10 sm:w-10",
  },
  {
    Icon: BoltIcon,
    className: "left-[3%] top-[52%]",
    animation: "animate-pulse-soft",
    size: "h-8 w-8 sm:h-10 sm:w-10",
  },
  {
    Icon: WrenchScrewdriverIcon,
    className: "right-[4%] top-[55%]",
    animation: "animate-drift",
    delay: "1.5s",
    size: "h-9 w-9 sm:h-11 sm:w-11",
  },
  {
    Icon: ArrowPathIcon,
    className: "left-[18%] bottom-[8%]",
    animation: "animate-recycle-spin-reverse",
    delay: "3s",
    size: "h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]",
  },
  {
    Icon: TruckIcon,
    className: "left-0 top-[72%]",
    animation: "animate-drive-across",
    delay: "2s",
    duration: "22s",
    size: "h-10 w-10 sm:h-12 sm:w-12",
  },
];

export function IndustrialRecyclingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {floatingIcons.map(
        ({ Icon, className, animation, delay, duration, size }, index) => (
          <div
            key={index}
            className={`absolute text-blue-300/30 ${className} ${animation}`}
            style={{
              animationDelay: delay,
              animationDuration: duration,
            }}
          >
            <Icon className={`${size} drop-shadow-sm`} strokeWidth={1.25} />
          </div>
        )
      )}

      {/* Recycling symbol cluster — center background */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
        <ArrowPathIcon className="animate-recycle-spin h-32 w-32 text-blue-400/40 sm:h-40 sm:w-40" />
      </div>
    </div>
  );
}
