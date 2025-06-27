import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  className: string;
  background: ReactNode;
  Icon: React.ElementType;
  description: string;
  href: string;
  cta: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[24rem] grid-cols-3 gap-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/50",
      // light styles
      "bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl",
      // dark styles
      "dark:bg-gray-900/80 dark:border-gray-700/50 dark:shadow-2xl",
      "transition-all duration-300 hover:scale-[1.02]",
      className,
    )}
    {...props}
  >
    <div className="relative">{background}</div>
    
    {/* Blur overlay at the bottom for text readability */}
    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/80 via-white/40 via-white/20 to-transparent backdrop-blur-sm dark:from-gray-900/80 dark:via-gray-900/40 dark:via-gray-900/20" />
    
    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300">
      <Icon className="h-12 w-12 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out" />
      <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
        {name}
      </h3>
      <p className="max-w-lg text-neutral-400">{description}</p>
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-gradient-to-t group-hover:from-[#007FFF]/5 group-hover:to-transparent" />
  </div>
);

export { BentoCard, BentoGrid };
