import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RentStabilizedBadgeProps {
  status?: string | null;
  probability?: number | null;
}

export function RentStabilizedBadge({
  status,
  probability,
}: RentStabilizedBadgeProps) {
  if (!status || status === "unknown") {
    return null;
  }

  const getBadgeDetails = () => {
    switch (status) {
      case "confirmed":
        return {
          label: "Rent Stabilized",
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600",
          tooltip: "This building is confirmed rent stabilized based on NYC data",
        };
      case "probable":
        const percentage = probability ? Math.round(probability * 100) : 0;
        return {
          label: `${percentage}% Likely Stabilized`,
          variant: "secondary" as const,
          className: "bg-yellow-500 hover:bg-yellow-600 text-white",
          tooltip: `${percentage}% probability based on building characteristics`,
        };
      case "unlikely":
        return {
          label: "Not Stabilized",
          variant: "outline" as const,
          className: "",
          tooltip: "This building is unlikely to be rent stabilized",
        };
      default:
        return null;
    }
  };

  const details = getBadgeDetails();
  if (!details) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={details.variant} className={`${details.className} gap-1`}>
            {details.label}
            <InfoIcon className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{details.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}