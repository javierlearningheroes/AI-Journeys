
import * as React from "react";
import { cn } from "../../lib/utils";

// Define the props for the DestinationCard component
// Added Omit to resolve type conflict between Div and Anchor onClick events in the inherited interface
interface DestinationCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  imageUrl: string;
  location: string;
  flag: string;
  stats: string;
  href?: string;
  themeColor: string; // e.g., "150 50% 25%" for a deep green
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  ({ className, imageUrl, location, flag, stats, href = "#", themeColor, onClick, ...props }, ref) => {
    // Custom click handler that manages the internal anchor tag logic
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (href === "#") {
        e.preventDefault();
      }
      if (onClick) {
        onClick(e);
      }
    };

    return (
      <div
        ref={ref}
        style={{
          // @ts-ignore - CSS custom properties are valid
          "--theme-color": themeColor,
        } as React.CSSProperties}
        className={cn("group w-full h-full", className)}
        {...props}
      >
        <a
          href={href}
          onClick={handleClick}
          className="relative block w-full h-full rounded-2xl overflow-hidden shadow-lg 
                     transition-all duration-500 ease-in-out 
                     group-hover:scale-105 group-hover:shadow-[0_0_60px_-15px_hsl(var(--theme-color)/0.6)]"
          aria-label={`Explore details for ${location}`}
          style={{
             boxShadow: `0 0 40px -15px hsl(var(--theme-color) / 0.5)`
          }}
        >
          {/* Background Image with Parallax Zoom */}
          <div
            className="absolute inset-0 bg-cover bg-center 
                       transition-transform duration-500 ease-in-out group-hover:scale-110"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Themed Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(var(--theme-color) / 0.9), hsl(var(--theme-color) / 0.6) 30%, transparent 60%)`,
            }}
          />
          
          {/* Content */}
          <div className="relative flex flex-col justify-end h-full p-6 text-white">
            <h3 className="text-3xl font-bold tracking-tight mb-2">
              {location} <span className="text-2xl ml-1">{flag}</span>
            </h3>
            <p className="text-sm text-white/80 font-medium min-h-[60px]">{stats}</p>
          </div>
        </a>
      </div>
    );
  }
);
DestinationCard.displayName = "DestinationCard";

export { DestinationCard };
