"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Building2, Plus, Clock, Timer, Zap, Bell, Lock, Trash2, Edit, MoreVertical, Pause, ChevronRight, Mail, Smartphone } from "lucide-react";
import { Button, Badge, Card, Modal, Menu, ActionIcon } from "@mantine/core";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCountdown } from "@/components/alerts/alert-countdown";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Alert = {
  id: string;
  name: string;
  areas: string;
  minPrice: number | null;
  maxPrice: number | null;
  preferredFrequency: '15min' | '30min' | '1hour' | '1hour-sms';
  isActive: boolean;
  enableEmailNotifications: boolean;
  enablePhoneNotifications: boolean;
  createdAt: string;
  lastChecked: string | null;
};

type AlertStats = {
  avgNewListings: number;
  totalNewListingsFound: number;
  lastRunAt: string | null;
  successRate: number;
};

const TIER_ICONS = {
  '1hour': <Clock className="h-4 w-4" />,
  '1hour-sms': <Bell className="h-4 w-4" />,
  '30min': <Timer className="h-4 w-4" />,
  '15min': <Zap className="h-4 w-4" />,
};

const TIER_LABELS = {
  '1hour': 'Hourly Checks',
  '1hour-sms': 'Hourly + SMS',
  '30min': '30-Min Checks',
  '15min': '15-Min Checks',
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertStats, setAlertStats] = useState<Record<string, AlertStats>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAlertForNeighborhoods, setSelectedAlertForNeighborhoods] = useState<Alert | null>(null);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      const fetchedAlerts = data.alerts || [];
      setAlerts(fetchedAlerts);

      // Fetch stats for each alert in parallel
      if (fetchedAlerts.length > 0) {
        const statsPromises = fetchedAlerts.map(async (alert: Alert) => {
          try {
            const statsResponse = await fetch(`/api/alerts/${alert.id}/stats`);
            const statsData = await statsResponse.json();
            return { id: alert.id, stats: statsData.stats };
          } catch (error) {
            console.error(`Error fetching stats for alert ${alert.id}:`, error);
            return { id: alert.id, stats: null };
          }
        });

        const allStats = await Promise.all(statsPromises);
        const statsMap = allStats.reduce((acc, { id, stats }) => {
          if (stats) acc[id] = stats;
          return acc;
        }, {} as Record<string, AlertStats>);

        setAlertStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async () => {
    if (!alertToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/alerts/${alertToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }

      toast.success('Alert deleted', {
        description: `"${alertToDelete.name}" has been deleted successfully.`,
      });

      // Remove the alert from state
      setAlerts(alerts.filter(a => a.id !== alertToDelete.id));
      setAlertToDelete(null);
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Error', {
        description: 'Failed to delete alert. Please try again.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeAlerts = alerts.filter(a => a.isActive);
  const inactiveAlerts = alerts.filter(a => !a.isActive);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Rental Alerts
          </h1>
          <p className="text-muted-foreground mt-1.5">
            Get notified when new listings match your criteria
          </p>
        </div>
        <Button component={Link} href="/alerts/create" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Alert
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-pulse">
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-md" />
              <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/10 shadow-lg">
                <Building2 className="h-12 w-12 text-primary" strokeWidth={1.5} />
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background animate-pulse" />
              </div>
            </div>
            <div className="absolute -left-4 top-1/2 h-2 w-2 bg-primary/30 rounded-full" />
            <div className="absolute -right-4 top-1/3 h-2 w-2 bg-primary/30 rounded-full" />
            <div className="absolute left-1/2 -bottom-2 h-1.5 w-1.5 bg-primary/30 rounded-full" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">
            No alerts yet
          </h2>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Create your first alert to start receiving notifications when new
            rental listings match your search criteria.
          </p>
          <Button component={Link} href="/alerts/create" size="lg" className="gap-2 cursor-pointer hover:scale-105 transition-all">
            <Plus className="h-4 w-4" />
            Create Your First Alert
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-muted-foreground mb-3">Active Alerts</h2>
              <div className="space-y-2">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all"
                  >
                    {/* Left: Name & Neighborhoods */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{alert.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {TIER_LABELS[alert.preferredFrequency]}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedAlertForNeighborhoods(alert)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                      >
                        {alert.areas.split(',').length} neighborhoods
                      </button>
                    </div>

                    {/* Center: Notification types */}
                    <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                      {alert.enableEmailNotifications && <Mail className="h-3.5 w-3.5" />}
                      {alert.enablePhoneNotifications && <Smartphone className="h-3.5 w-3.5" />}
                    </div>

                    {/* Right: Status */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                        <span className="text-muted-foreground">
                          <AlertCountdown
                            lastChecked={alert.lastChecked ? new Date(alert.lastChecked) : null}
                            preferredFrequency={alert.preferredFrequency}
                            isActive={alert.isActive}
                          />
                        </span>
                      </div>

                      {/* Menu */}
                      <Menu shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            component={Link}
                            href={`/alerts/${alert.id}/edit`}
                            leftSection={<Edit className="h-3.5 w-3.5" />}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            color="red"
                            leftSection={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => setAlertToDelete(alert)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Alerts - Upgrade CTAs */}
          {inactiveAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Inactive Alerts - Upgrade Required</h2>
              <div className="grid gap-4">
                {inactiveAlerts.map((alert) => (
                  <Card key={alert.id} className="p-6 border-amber-500/20 bg-amber-500/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          <h3 className="text-lg font-semibold">{alert.name}</h3>
                          <Badge variant="outline" className="gap-1 border-amber-500/30">
                            {TIER_ICONS[alert.preferredFrequency]}
                            {TIER_LABELS[alert.preferredFrequency]}
                          </Badge>
                          <Badge color="yellow" className="bg-amber-500/10 text-amber-900 dark:text-amber-100">
                            Inactive
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <button
                            onClick={() => setSelectedAlertForNeighborhoods(alert)}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                          >
                            <span>{alert.areas.split(',').length} neighborhoods</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                          {(alert.minPrice || alert.maxPrice) && (
                            <span>
                              • ${alert.minPrice || 0} - ${alert.maxPrice || '∞'}
                            </span>
                          )}
                        </div>
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
                          <p className="text-sm text-amber-900 dark:text-amber-100 font-medium mb-1">
                            Upgrade to activate this alert
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300">
                            This alert requires {TIER_LABELS[alert.preferredFrequency]}. Subscribe to start receiving notifications.
                          </p>
                        </div>
                        <Button
                          component={Link}
                          href="/subscriptions"
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          Upgrade to {TIER_LABELS[alert.preferredFrequency]}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <ActionIcon component={Link} href={`/alerts/${alert.id}/edit`} variant="subtle" size="sm">
                          <Edit className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          onClick={() => setAlertToDelete(alert)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Neighborhoods Modal */}
      <Modal
        opened={selectedAlertForNeighborhoods !== null}
        onClose={() => setSelectedAlertForNeighborhoods(null)}
        title={`Neighborhoods for ${selectedAlertForNeighborhoods?.name}`}
        size="lg"
        centered
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {selectedAlertForNeighborhoods?.areas.split(',').map((area, index) => (
            <div
              key={index}
              className="px-2 py-1 text-xs bg-muted rounded text-foreground"
            >
              {area.trim()}
            </div>
          ))}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={alertToDelete !== null} onOpenChange={() => setAlertToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the alert "{alertToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAlert}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Alert"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
