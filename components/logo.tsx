import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  showText?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({
  href = "/",
  showText = true,
  showTagline = false,
  size = "md",
  className,
}: LogoProps) {
  const sizeClasses = {
    sm: {
      size: 32,
      text: "text-base",
      tagline: "text-[10px]",
    },
    md: {
      size: 40,
      text: "text-lg",
      tagline: "text-xs",
    },
    lg: {
      size: 48,
      text: "text-xl",
      tagline: "text-sm",
    },
  };

  const logoContent = (
    <div className={cn("flex items-center gap-3 group transition-all duration-300", className)}>
      {/* Building Logo Icon */}
      <div className="relative flex items-center justify-center rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-sm border border-primary/20">
        <Image
          src="/logo.png"
          alt="RentNotify"
          width={sizeClasses[size].size}
          height={sizeClasses[size].size}
          className="object-cover w-full h-full transition-all duration-300 group-hover:scale-110 brightness-110"
          priority
        />
      </div>

      {/* Optional Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "font-bold tracking-tight transition-all duration-300",
            "group-hover:text-primary",
            sizeClasses[size].text
          )}>
            RentNotify
          </span>
          {showTagline && (
            <span className={cn(
              "text-muted-foreground mt-0.5 transition-colors duration-300",
              "group-hover:text-muted-foreground/80",
              sizeClasses[size].tagline
            )}>
              Never miss a listing
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
