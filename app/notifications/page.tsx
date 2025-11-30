"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { NotificationsList } from "@/components/notifications/notifications-list";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1.5">
          Recent listings found by your alerts
        </p>
      </div>

      {/* Notifications List */}
      <NotificationsList />
    </DashboardLayout>
  );
}
