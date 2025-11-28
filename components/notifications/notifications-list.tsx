"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Skeleton, Button } from "@mantine/core";
import { Bell, Inbox } from "lucide-react";
import { NotificationFilters } from "./notification-filters";
import { NotificationGroup } from "./notification-group";

// ============================================================================
// TYPES
// ============================================================================

interface AlertData {
  id: string;
  name: string;
}

interface ListingData {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  neighborhood: string;
  listingUrl: string;
}

interface NotificationData {
  id: string;
  createdAt: string;
  channel: "email" | "sms" | "in_app";
  status: "pending" | "sent" | "failed";
  sentAt: string | null;
  alert: AlertData | null;
  listing: ListingData | null;
}

interface GroupedNotification {
  timestamp: Date;
  alertName: string;
  alertId: string;
  listings: ListingData[];
}

// ============================================================================
// GROUPING LOGIC
// ============================================================================

/**
 * Groups notifications by alert run (same alert + same minute timestamp)
 */
function groupNotifications(notifications: NotificationData[]): GroupedNotification[] {
  const groups = new Map<string, GroupedNotification>();

  for (const notification of notifications) {
    if (!notification.alert || !notification.listing) continue;

    // Round timestamp to same minute for grouping
    const date = new Date(notification.createdAt);
    date.setSeconds(0, 0);
    const groupKey = `${notification.alert.id}-${date.toISOString()}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        timestamp: date,
        alertName: notification.alert.name,
        alertId: notification.alert.id,
        listings: [],
      });
    }

    groups.get(groupKey)!.listings.push({
      id: notification.listing.id,
      address: notification.listing.address,
      price: notification.listing.price,
      bedrooms: notification.listing.bedrooms,
      bathrooms: notification.listing.bathrooms,
      neighborhood: notification.listing.neighborhood,
      listingUrl: notification.listing.listingUrl,
    });
  }

  // Sort by timestamp descending
  return Array.from(groups.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

// ============================================================================
// SKELETON LOADING
// ============================================================================

function NotificationsListSkeleton() {
  return (
    <div className="space-y-4">
      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3">
        <Skeleton height={36} width={180} radius="md" />
        <Skeleton height={36} width={140} radius="md" />
        <Skeleton height={36} width={140} radius="md" />
      </div>

      {/* Groups Skeleton */}
      {[1, 2, 3].map((i) => (
        <Card key={i} className="rounded-xl" padding={0}>
          <div className="px-4 py-3 border-b border-border">
            <Skeleton height={12} width={120} radius="md" mb={8} />
            <Skeleton height={16} width={200} radius="md" />
          </div>
          <div className="p-3 space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton height={28} width={28} radius="md" />
                  <div>
                    <Skeleton height={14} width={180} radius="md" mb={4} />
                    <Skeleton height={10} width={80} radius="md" />
                  </div>
                </div>
                <Skeleton height={14} width={80} radius="md" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// EMPTY STATE
// ============================================================================

function EmptyState() {
  return (
    <Card className="rounded-xl" padding="xl">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          When your alerts find new listings, they&apos;ll appear here.
          Create an alert to start tracking rentals.
        </p>
      </div>
    </Card>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="rounded-xl" padding="xl">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="p-4 rounded-full bg-red-50 dark:bg-red-950 mb-4">
          <Bell className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Unable to load notifications</h3>
        <p className="text-sm text-muted-foreground mb-4">
          We&apos;re having trouble connecting. Please try again.
        </p>
        <Button onClick={onRetry} variant="filled" color="blue">
          Retry
        </Button>
      </div>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NotificationsList() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter state
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string | null>("7"); // Default to last 7 days

  // Fetch notifications
  const fetchNotifications = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (selectedAlertId) params.set("alertId", selectedAlertId);
      if (selectedDays) params.set("days", selectedDays);
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();

      if (cursor) {
        // Append for pagination
        setNotifications((prev) => [...prev, ...data.notifications]);
      } else {
        // Replace for initial load or filter change
        setNotifications(data.notifications);
      }

      setNextCursor(data.nextCursor);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(true);
    }
  }, [selectedAlertId, selectedDays]);

  // Fetch alerts for filter dropdown
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch("/api/alerts");
      if (!response.ok) throw new Error("Failed to fetch alerts");

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Error fetching alerts:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(false);
      await Promise.all([fetchNotifications(), fetchAlerts()]);
      setLoading(false);
    };

    loadData();
  }, [fetchNotifications, fetchAlerts]);

  // Refetch when filters change
  useEffect(() => {
    if (!loading) {
      setLoading(true);
      setError(false);
      fetchNotifications().finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlertId, selectedDays]);

  // Load more handler
  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchNotifications(nextCursor);
    setLoadingMore(false);
  };

  // Retry handler
  const handleRetry = () => {
    setLoading(true);
    setError(false);
    Promise.all([fetchNotifications(), fetchAlerts()]).finally(() => setLoading(false));
  };

  if (loading) {
    return <NotificationsListSkeleton />;
  }

  if (error) {
    return <ErrorState onRetry={handleRetry} />;
  }

  const groupedNotifications = groupNotifications(notifications);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <NotificationFilters
        alerts={alerts}
        selectedAlertId={selectedAlertId}
        selectedDays={selectedDays}
        onAlertChange={setSelectedAlertId}
        onDaysChange={setSelectedDays}
      />

      {/* Notification Groups */}
      {groupedNotifications.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {groupedNotifications.map((group) => (
            <NotificationGroup
              key={`${group.alertId}-${group.timestamp.toISOString()}`}
              timestamp={group.timestamp}
              alertName={group.alertName}
              listings={group.listings}
            />
          ))}

          {/* Load More Button */}
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button
                variant="subtle"
                onClick={handleLoadMore}
                loading={loadingMore}
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
