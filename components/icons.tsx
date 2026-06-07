import {
  ArrowRightIcon as HeroArrowRight,
  ArrowPathIcon,
  BeakerIcon,
  BellIcon as HeroBell,
  BuildingOffice2Icon,
  ChevronDownIcon as HeroChevronDown,
  PlusIcon as HeroPlus,
  UserGroupIcon,
} from "@heroicons/react/24/solid";

export const cardIconClass = "h-12 w-12 sm:h-14 sm:w-14";

export function BellIcon({ className }: { className?: string }) {
  return <HeroBell className={className} aria-hidden />;
}

export function ChevronDownIcon({ className }: { className?: string }) {
  return <HeroChevronDown className={className} aria-hidden />;
}

export function ArrowRightIcon({ className }: { className?: string }) {
  return <HeroArrowRight className={className} aria-hidden />;
}

export function RecycleBinIcon({ className }: { className?: string }) {
  return (
    <ArrowPathIcon
      className={className ?? cardIconClass}
      aria-hidden
    />
  );
}

export function BuildingIcon({ className }: { className?: string }) {
  return (
    <BuildingOffice2Icon
      className={className ?? cardIconClass}
      aria-hidden
    />
  );
}

export function BiohazardBinIcon({ className }: { className?: string }) {
  return (
    <BeakerIcon className={className ?? cardIconClass} aria-hidden />
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return <HeroPlus className={className ?? cardIconClass} aria-hidden />;
}

export function BeneficiaryIcon({ className }: { className?: string }) {
  return <UserGroupIcon className={className ?? cardIconClass} aria-hidden />;
}
