"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Building2, Plus, Clock, Timer, Zap, Bell, Lock, Trash2, Edit, MoreVertical, Pause, ChevronRight } from "lucide-react";
import { EnvelopeIcon, DevicePhoneMobileIcon } from "@heroicons/react/20/solid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <Link href="/alerts/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Alert
          </Button>
        </Link>
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
          <Link href="/alerts/create">
            <Button size="lg" className="gap-2 cursor-pointer hover:scale-105 transition-all">
              <Plus className="h-4 w-4" />
              Create Your First Alert
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
              <div className="grid gap-4">
                {activeAlerts.map((alert) => (
                  <Card key={alert.id} className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{alert.name}</h3>
                          <Badge variant="outline" className="gap-1">
                            {TIER_ICONS[alert.preferredFrequency]}
                            {TIER_LABELS[alert.preferredFrequency]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        {/* Live indicator and countdown */}
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="relative">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <div className="absolute inset-0 h-2 w-2 rounded-full bg-green-500 animate-ping" />
                              </div>
                              <span className="text-xs font-medium text-green-600 dark:text-green-400">Live</span>
                            </div>
                            <AlertCountdown
                              lastChecked={alert.lastChecked ? new Date(alert.lastChecked) : null}
                              preferredFrequency={alert.preferredFrequency}
                              isActive={alert.isActive}
                            />
                          </div>

                          {/* Dropdown menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause Alert
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/alerts/${alert.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Alert
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setAlertToDelete(alert)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Alert
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Notification Methods - Bottom */}
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                      <div className="flex items-center gap-3">
                        {alert.enableEmailNotifications && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <EnvelopeIcon className="h-4 w-4" />
                            Email
                          </span>
                        )}
                        {alert.enablePhoneNotifications && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <DevicePhoneMobileIcon className="h-4 w-4" />
                            SMS
                          </span>
                        )}
                      </div>

                      {/* Statistics - Bottom Right */}
                      {alertStats[alert.id] && (
                        <div className="text-sm text-muted-foreground">
                          {alertStats[alert.id].totalNewListingsFound > 0 ? (
                            <>
                              <span className="font-semibold text-foreground">
                                {alertStats[alert.id].totalNewListingsFound}
                              </span>
                              {' '}apartment{alertStats[alert.id].totalNewListingsFound === 1 ? '' : 's'} found
                            </>
                          ) : (
                            'No apartments found yet'
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
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
                          <Badge variant="secondary" className="bg-amber-500/10 text-amber-900 dark:text-amber-100">
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
                          asChild
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <Link href="/subscriptions">
                            Upgrade to {TIER_LABELS[alert.preferredFrequency]}
                          </Link>
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/alerts/${alert.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setAlertToDelete(alert)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
      <Dialog open={selectedAlertForNeighborhoods !== null} onOpenChange={() => setSelectedAlertForNeighborhoods(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neighborhoods for {selectedAlertForNeighborhoods?.name}</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>

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
