import { Badge, Tooltip } from "@mantine/core";
import { InfoIcon } from "lucide-react";

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
          color: "green" as const,
          tooltip: "This building is confirmed rent stabilized based on NYC data",
        };
      case "probable":
        const percentage = probability ? Math.round(probability * 100) : 0;
        return {
          label: `${percentage}% Likely Stabilized`,
          color: "yellow" as const,
          tooltip: `${percentage}% probability based on building characteristics`,
        };
      case "unlikely":
        return {
          label: "Not Stabilized",
          color: "gray" as const,
          tooltip: "This building is unlikely to be rent stabilized",
        };
      default:
        return null;
    }
  };

  const details = getBadgeDetails();
  if (!details) return null;

  return (
    <Tooltip label={details.tooltip} withArrow>
      <Badge color={details.color} variant="light" className="gap-1 cursor-help">
        {details.label}
        <InfoIcon className="h-3 w-3" />
      </Badge>
    </Tooltip>
  );
}