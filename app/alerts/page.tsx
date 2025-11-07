"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, Plus } from "lucide-react";

export default function AlertsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
              <DialogDescription>
                Set up criteria for your rental search. We'll notify you when
                new listings match.
              </DialogDescription>
            </DialogHeader>
            {/* Form will go here */}
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Alert creation form coming soon...
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Create Alert
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-8">
          {/* Outer glow rings */}
          <div className="absolute inset-0 animate-pulse">
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl scale-150" />
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
          </div>

          {/* Main icon container with gradient */}
          <div className="relative">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl blur-md" />

            {/* Icon container */}
            <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/10 shadow-lg">
              <Building2 className="h-12 w-12 text-primary" strokeWidth={1.5} />

              {/* Notification dot */}
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full border-2 border-background animate-pulse" />
            </div>
          </div>

          {/* Decorative elements */}
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
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Create Your First Alert
        </Button>
      </div>
    </DashboardLayout>
  );
}
