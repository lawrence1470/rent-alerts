"use client";

import { Select } from "@mantine/core";
import { Filter } from "lucide-react";

interface AlertOption {
  id: string;
  name: string;
}

interface NotificationFiltersProps {
  alerts: AlertOption[];
  selectedAlertId: string | null;
  selectedDays: string | null;
  onAlertChange: (alertId: string | null) => void;
  onDaysChange: (days: string | null) => void;
}

const daysOptions = [
  { value: "", label: "All Time" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export function NotificationFilters({
  alerts,
  selectedAlertId,
  selectedDays,
  onAlertChange,
  onDaysChange,
}: NotificationFiltersProps) {
  const alertOptions = [
    { value: "", label: "All Alerts" },
    ...alerts.map((alert) => ({
      value: alert.id,
      label: alert.name,
    })),
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex items-center gap-2 text-muted-foreground shrink-0">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <div className="flex flex-wrap gap-3 flex-1">
        <Select
          placeholder="All Alerts"
          data={alertOptions}
          value={selectedAlertId || ""}
          onChange={(value) => onAlertChange(value || null)}
          size="sm"
          className="w-full sm:w-auto sm:min-w-[180px]"
          clearable={false}
        />

        <Select
          placeholder="All Time"
          data={daysOptions}
          value={selectedDays || ""}
          onChange={(value) => onDaysChange(value || null)}
          size="sm"
          className="w-full sm:w-auto sm:min-w-[140px]"
          clearable={false}
        />
      </div>
    </div>
  );
}
